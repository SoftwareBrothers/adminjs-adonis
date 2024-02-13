import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { type HasMany } from '@adonisjs/lucid/types/relations'

import Person from './person.js'

export default class Organization extends BaseModel {
  public static table = 'organizations'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @hasMany(() => Person)
  declare members: HasMany<typeof Person>
}
