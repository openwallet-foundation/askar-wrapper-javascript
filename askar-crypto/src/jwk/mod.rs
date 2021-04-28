//! JSON Web Key (JWK) support

#[cfg(feature = "alloc")]
use alloc::{string::String, vec::Vec};

use sha2::Sha256;

#[cfg(feature = "alloc")]
use crate::buffer::SecretBytes;
use crate::{
    buffer::{HashBuffer, ResizeBuffer},
    error::Error,
};

mod encode;
pub use self::encode::{JwkEncoder, JwkEncoderMode};

mod ops;
pub use self::ops::{KeyOps, KeyOpsSet};

mod parts;
pub use self::parts::JwkParts;

/// Support for converting a key into a JWK
pub trait ToJwk {
    /// Write the JWK representation to an encoder
    fn encode_jwk(&self, enc: &mut JwkEncoder<'_>) -> Result<(), Error>;

    /// Create the JWK thumbprint of the key
    #[cfg(feature = "alloc")]
    #[cfg_attr(docsrs, doc(cfg(feature = "alloc")))]
    fn to_jwk_thumbprint(&self) -> Result<String, Error> {
        let mut v = Vec::with_capacity(43);
        write_jwk_thumbprint(self, &mut v)?;
        Ok(String::from_utf8(v).unwrap())
    }

    /// Create a JWK of the public key
    #[cfg(feature = "alloc")]
    #[cfg_attr(docsrs, doc(cfg(feature = "alloc")))]
    fn to_jwk_public(&self) -> Result<String, Error> {
        let mut v = Vec::with_capacity(128);
        let mut buf = JwkEncoder::new(&mut v, JwkEncoderMode::PublicKey)?;
        self.encode_jwk(&mut buf)?;
        buf.finalize()?;
        Ok(String::from_utf8(v).unwrap())
    }

    /// Create a JWK of the secret key
    #[cfg(feature = "alloc")]
    #[cfg_attr(docsrs, doc(cfg(feature = "alloc")))]
    fn to_jwk_secret(&self) -> Result<SecretBytes, Error> {
        let mut v = SecretBytes::with_capacity(128);
        let mut buf = JwkEncoder::new(&mut v, JwkEncoderMode::SecretKey)?;
        self.encode_jwk(&mut buf)?;
        buf.finalize()?;
        Ok(v)
    }
}

/// Encode a key's JWK into a buffer
pub fn write_jwk_thumbprint<K: ToJwk + ?Sized>(
    key: &K,
    output: &mut dyn ResizeBuffer,
) -> Result<(), Error> {
    let mut hasher = HashBuffer::<Sha256>::new();
    let mut buf = JwkEncoder::new(&mut hasher, JwkEncoderMode::Thumbprint)?;
    key.encode_jwk(&mut buf)?;
    buf.finalize()?;
    let hash = hasher.finalize();
    base64::encode_config_slice(&hash, base64::URL_SAFE_NO_PAD, output.buffer_extend(43)?);
    Ok(())
}

/// Support for loading a key instance from a JWK
pub trait FromJwk: Sized {
    /// Import the key from a JWK string reference
    fn from_jwk(jwk: &str) -> Result<Self, Error> {
        JwkParts::from_str(jwk).and_then(Self::from_jwk_parts)
    }

    /// Import the key from a JWK byte slice
    fn from_jwk_slice(jwk: &[u8]) -> Result<Self, Error> {
        JwkParts::from_slice(jwk).and_then(Self::from_jwk_parts)
    }

    /// Import the key from a pre-parsed JWK
    fn from_jwk_parts(jwk: JwkParts<'_>) -> Result<Self, Error>;
}
