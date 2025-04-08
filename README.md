# Test Framework Documentation

## Initial Setup
First, create a 'setup' request -- this can be a call to google.com, it doesn't matter.

Inside of 'pre-request scripts' copy the entire contents of framework.js.

Then hit "Send". This will compile the test framework and store it as a global variable.

Second, create some tests by adding this line of code to the top of your post-request scripts:

const Test = eval('(' + pm.globals.get('testFramework') + ')');

All done!

## Response Code Tests

### ResponseCode(code)
Tests if the response status code matches the expected code.

Test.ResponseCode(200); // Tests if response is 200

### Shorthand Response Code Methods
Convenience methods for common response codes:

Test.Response200(); // Success
Test.Response201(); // Created
Test.Response204(); // No Content
Test.Response400(); // Bad Request
Test.Response401(); // Unauthorized
Test.Response403(); // Forbidden
Test.Response404(); // Not Found

## Value Tests

### IsNull(whitelist, fuzzySearch = false)
Tests if specified fields are null.

// Single field

Test.IsNull('userId');

// Multiple fields

Test.IsNull(['userId', 'email']);

// With fuzzy search

Test.IsNull('user', true); // Will match 'user.id', 'user.email', etc.

### IsNotNull(whitelist, fuzzySearch = false)
Tests if specified fields are not null and not empty.

// Single field

Test.IsNotNull('userId');


// Multiple fields

Test.IsNotNull(['userId', 'email']);


// With fuzzy search

Test.IsNotNull('user', true); // Will match all user.* properties

### IsEqual(field, expected)
Tests if a field equals an expected value.

Test.IsEqual('user.age', 25);
Test.IsEqual('status', 'active');

### IsNotEqual(field, expected)
Tests if a field does not equal a specific value.

Test.IsNotEqual('user.status', 'deleted');

### IsGreaterThan(field, expected)
Tests if a field is greater than a value.

Test.IsGreaterThan('user.age', 18);
Test.IsGreaterThan('price', 0);

### IsGreaterOrEqualTo(field, expected)
Tests if a field is greater than or equal to a value.

Test.IsGreaterOrEqualTo('quantity', 1);

### IsLessThan(field, expected)
Tests if a field is less than a value.

Test.IsLessThan('errorCount', 5);

### IsLessOrEqualTo(field, expected)
Tests if a field is less than or equal to a value.

Test.IsLessOrEqualTo('page', 10);

### AllResponseFieldsNotNull()
Tests that all fields in the response are not null.

Test.AllResponseFieldsNotNull();

## Performance Tests

### ResponseTime(maxTime = 200)
Tests if the response time is below a threshold (default 200ms).

Test.ResponseTime(); // Uses default 200ms
Test.ResponseTime(500); // Custom threshold of 500ms

## Variable Management

### GetVariable(name)
Retrieves a variable value.

const userId = Test.GetVariable('userId');

### SetVariable(name, value)
Sets a variable value.

Test.SetVariable('userId', '12345');

### DeleteVariable(name)
Removes a variable.

Test.DeleteVariable('tempVar');

### Description(desc)
Sets a custom description for the next test.

Test.Description('Custom test description');
Test.Response200(); // Will use the custom description

## Working with Nested Objects

The framework can handle nested objects using dot notation:

// Given this response:
{
    "user": {
        "profile": {
            "name": "John",
            "age": 30
        }
    }
}

// You can test:

Test.IsNotNull('user.profile.name');
Test.IsEqual('user.profile.age', 30);

## Best Practices

1. Custom Descriptions

// Add custom descriptions for clarity
Test.Description('User should be at least 18 years old');
Test.IsGreaterOrEqualTo('user.age', 18);

2. Group Related Tests

// Test user profile completeness
Test.IsNotNull([
    'user.id',
    'user.name',
    'user.email',
    'user.profile'
]);

3. Response Validation

// First check response code
Test.Response200();

// Then check data
Test.IsNotNull('data');
Test.IsEqual('data.status', 'success');

## Complete Example

// Initialize the framework
const Test = eval('(' + pm.globals.get('testFramework') + ')');

// Check response code
Test.Response200();

// Check response time
Test.ResponseTime(500);

// Verify required fields exist
Test.IsNotNull([
    'data.id',
    'data.user.name',
    'data.user.email'
]);

// Check specific values
Test.IsEqual('data.user.status', 'active');
Test.IsGreaterThan('data.user.age', 18);

// Store values for later use
Test.SetVariable('userId', pm.response.json().data.id);
