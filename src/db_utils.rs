use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::sync::Arc;

use sqlx::{database::HasArguments, Arguments, Database, Encode, IntoArguments, Type};

use super::error::Result as KvResult;
use super::future::blocking;
use super::keys::{store::StoreKey, AsyncEncryptor};
use super::types::{EncEntry, EncEntryTag, Expiry, ProfileId, UpdateEntry};
use super::wql::{
    self,
    sql::TagSqlEncoder,
    tags::{tag_query, TagQueryEncoder},
};

pub const PAGE_SIZE: usize = 32;

pub struct QueryParams<'q, DB: Database> {
    args: <DB as HasArguments<'q>>::Arguments,
    count: usize,
}

impl<'q, DB: Database> QueryParams<'q, DB> {
    pub fn new() -> Self {
        Self {
            args: Default::default(),
            count: 0,
        }
    }

    pub fn extend<I, T>(&mut self, vals: I)
    where
        I: IntoIterator<Item = T>,
        T: 'q + Send + sqlx::Encode<'q, DB> + sqlx::Type<DB>,
    {
        for item in vals {
            self.args.add(item);
            self.count += 1;
        }
    }

    pub fn push<T>(&mut self, val: T)
    where
        T: 'q + Send + sqlx::Encode<'q, DB> + sqlx::Type<DB>,
    {
        self.args.add(val);
        self.count += 1;
    }

    pub fn len(&self) -> usize {
        self.count
    }
}

impl<'q, DB> IntoArguments<'q, DB> for QueryParams<'q, DB>
where
    DB: Database,
    <DB as HasArguments<'q>>::Arguments: IntoArguments<'q, DB>,
{
    fn into_arguments(self) -> <DB as HasArguments<'q>>::Arguments {
        self.args.into_arguments()
    }
}

pub trait QueryPrepare {
    type DB: Database;

    fn placeholder(index: i64) -> String {
        format!("?{}", index)
    }

    fn limit_query<'q>(
        mut query: String,
        args: &mut QueryParams<'q, Self::DB>,
        offset: Option<i64>,
        limit: Option<i64>,
    ) -> String
    where
        i64: for<'e> Encode<'e, Self::DB> + Type<Self::DB>,
    {
        if offset.is_some() || limit.is_some() {
            let last_idx = (args.len() + 1) as i64;
            args.push(offset.unwrap_or(0));
            args.push(limit.unwrap_or(-1));
            let (limit, _next_idx) = replace_arg_placeholders::<Self>(" LIMIT $$, $$", last_idx);
            query.push_str(&limit);
        }
        query
    }
}

pub fn replace_arg_placeholders<Q: QueryPrepare + ?Sized>(
    filter: &str,
    start_index: i64,
) -> (String, i64) {
    let mut index = start_index;
    let mut s: String = filter.to_owned();
    while let Some(pos) = s.find("$$") {
        let arg_str = Q::placeholder(index);
        s.replace_range(pos..(pos + 2), &arg_str);
        index = index + 1;
    }
    (s, index)
}

pub fn expiry_timestamp(expire_ms: i64) -> KvResult<Expiry> {
    chrono::Utc::now()
        .checked_add_signed(chrono::Duration::milliseconds(expire_ms))
        .ok_or_else(|| err_msg!(Unexpected, "Invalid expiry timestamp"))
}

pub async fn encode_tag_filter<Q: QueryPrepare>(
    tag_filter: Option<wql::Query>,
    key: Option<Arc<StoreKey>>,
    offset: usize,
) -> KvResult<Option<(String, Vec<Vec<u8>>)>> {
    if let Some(tag_filter) = tag_filter {
        blocking(move || {
            let tag_query = tag_query(tag_filter)?;
            let mut enc = if let Some(key) = key {
                let key2 = key.clone();
                TagSqlEncoder::new(
                    move |name| Ok(key.encrypt_tag_name(name)?),
                    move |value| Ok(key2.encrypt_tag_value(value)?),
                )
            } else {
                TagSqlEncoder::new(
                    |name| Ok(name.as_bytes().to_vec()),
                    |value| Ok(value.as_bytes().to_vec()),
                )
            };
            let filter: String = enc.encode_query(&tag_query)?;
            let (filter, _next_idx) = replace_arg_placeholders::<Q>(&filter, (offset as i64) + 1);
            Ok(Some((filter, enc.arguments)))
        })
        .await
    } else {
        Ok(None)
    }
}

pub fn extend_query<'q, Q: QueryPrepare>(
    query: &str,
    args: &mut QueryParams<'q, Q::DB>,
    tag_filter: Option<(String, Vec<Vec<u8>>)>,
    offset: Option<i64>,
    limit: Option<i64>,
) -> KvResult<String>
where
    i64: for<'e> Encode<'e, Q::DB> + Type<Q::DB>,
    Vec<u8>: for<'e> Encode<'e, Q::DB> + Type<Q::DB>,
{
    let mut query = query.to_string();
    if let Some((filter_clause, filter_args)) = tag_filter {
        args.extend(filter_args);
        query.push_str(" AND "); // assumes WHERE already occurs
        query.push_str(&filter_clause);
    };
    if offset.is_some() || limit.is_some() {
        query = Q::limit_query(query, args, offset, limit);
    };
    Ok(query)
}

pub fn hash_lock_info(profile_id: ProfileId, lock_info: &UpdateEntry) -> i64 {
    let mut hasher = DefaultHasher::new();
    Hash::hash(&profile_id, &mut hasher);
    Hash::hash_slice(lock_info.entry.category.as_bytes(), &mut hasher);
    Hash::hash_slice(lock_info.entry.name.as_bytes(), &mut hasher);
    hasher.finish() as i64
}

pub struct PreparedUpdate {
    pub profile_id: ProfileId,
    pub enc_entry: EncEntry<'static>,
    pub enc_tags: Option<Vec<EncEntryTag>>,
    pub expire_ms: Option<i64>,
}

pub async fn prepare_update(
    profile_id: ProfileId,
    key: AsyncEncryptor<StoreKey>,
    entries: Vec<UpdateEntry>,
) -> KvResult<Vec<PreparedUpdate>> {
    let mut updates = Vec::with_capacity(entries.len());
    for update in entries {
        let (enc_entry, enc_tags) = key.encrypt_entry(update.entry).await?;
        updates.push(PreparedUpdate {
            profile_id,
            enc_entry,
            enc_tags,
            expire_ms: update.expire_ms,
        });
    }
    Ok(updates)
}