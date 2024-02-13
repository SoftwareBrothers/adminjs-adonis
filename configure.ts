import type Configure from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  await codemods.makeUsingStub(stubsRoot, 'config/adminjs.stub', {})
  await codemods.makeUsingStub(stubsRoot, 'config/component_loader.stub', {})
  await codemods.makeUsingStub(stubsRoot, 'config/auth.stub', {})
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@adminjs/adonis/adminjs_provider', ['web'])
  })
}
