// Simple test to see if our package can be imported without errors
console.log('Starting import test...')

try {
  console.log('Importing adonis-open-swagger...')
  const openSwagger = await import('adonis-open-swagger')
  console.log('adonis-open-swagger imported successfully:', Object.keys(openSwagger))

  // Test setting the global validator
  console.log('Setting global validator to typebox...')
  openSwagger.setGlobalValidator('typebox')
  console.log('Global validator set to:', openSwagger.getGlobalValidator())

  // Test importing TypeBox
  console.log('Importing TypeBox...')
  const { Type } = await import('@sinclair/typebox')
  console.log('TypeBox imported successfully')

  // Test a simple schema conversion
  console.log('Testing schema conversion...')
  const testSchema = Type.Object({
    name: Type.String(),
    age: Type.Number(),
  })
  console.log('Test schema created:', testSchema)
} catch (error) {
  console.error('Error during test:', error)
  console.error('Stack trace:', error.stack)
}

console.log('Import test completed.')
