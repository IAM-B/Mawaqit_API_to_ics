# Testing Documentation

## Test Structure

### Unit Tests
- Located in `tests/unit/`
- Test individual components in isolation
- Use mocks and stubs to isolate dependencies
- Focus on edge cases and error handling

### Integration Tests
- Located in `tests/integration/`
- Test component interactions
- Verify API endpoints
- Test ICS file generation
- Validate mosque search functionality

## Running Tests

```bash
# Run all tests with coverage
make test-all

# Run only unit tests
make test-unit

# Run only integration tests
make test-integration
```

## Test Coverage

Current coverage: 87%

### Areas Needing Coverage
- `app/models/prayer.py`
- `app/utils/date_utils.py`
- `app/modules/slot_editor.py`

## Best Practices
1. Keep unit and integration tests separate
2. Use meaningful test names
3. Follow the Arrange-Act-Assert pattern
4. Clean up test data after each test
5. Use fixtures for common test setup