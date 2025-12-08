import { NativeAskar } from './askar'

type MigrationOptions = {
  walletName: string
  walletKey: string
  specUri: string
  kdfLevel: string
}

export class Migration {
  public static async migrate(options: MigrationOptions): Promise<void> {
    await NativeAskar.instance.migrateIndySdk(options)
  }
}
