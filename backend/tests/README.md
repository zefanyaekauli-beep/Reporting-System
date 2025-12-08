# Tests

## Running Tests

```bash
# Install test dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

## Test Structure

- `conftest.py`: Shared fixtures (database, client, mock users)
- `test_health.py`: Health check endpoint tests
- `test_auth.py`: Authentication endpoint tests
- `test_pagination.py`: Pagination utility tests

## Adding New Tests

1. Create test file: `tests/test_<feature>.py`
2. Use fixtures from `conftest.py`
3. Follow naming convention: `test_<functionality>`

