import { BaseDatabase } from 'adminjs'

export default class Database extends BaseDatabase {
  constructor(db: any) {
    super(db)
  }

  static isAdapterFor(_database: any): boolean {
    return true
  }

  resources() {
    return []
  }
}
