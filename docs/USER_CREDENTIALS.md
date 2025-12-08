# User Credentials Guide

## 🔐 Default Passwords

### Development/Testing Users

All mock data users are created with the default password:
```
password123
```

### Legacy Auto-Create Users

These users are automatically created on first login with any password you provide:

| Username | Division | Role | Notes |
|----------|----------|------|-------|
| `security` | security | FIELD | Auto-created on first login |
| `cleaning` | cleaning | FIELD | Auto-created on first login |
| `parking` | parking | FIELD | Auto-created on first login |
| `driver` | driver | FIELD | Auto-created on first login |
| `supervisor` | security | SUPERVISOR | Auto-created on first login |
| `admin` | security | ADMIN | Auto-created on first login |

**Important**: The password you use on first login becomes the password for that user.

### Mock Data Users

These users are created by the mock data script:

| Username | Division | Role | Default Password |
|----------|----------|------|------------------|
| `security1` - `security5` | security | guard | `password123` |
| `cleaning1` - `cleaning4` | cleaning | CLEANER | `password123` |
| `parking1` - `parking3` | parking | user | `password123` |
| `supervisor` | security | supervisor | `password123` |

## 🛠️ Management Scripts

### List All Users

```bash
cd backend
python scripts/list_users.py
```

Output format:
```
Username             Role         Division     Company  Site      Password
--------------------------------------------------------------------------------
admin                ADMIN        security     1        None      ✅ VALID
cleaning1            CLEANER      cleaning     1        1         ✅ VALID
security1            guard         security     1        1         ✅ VALID
supervisor           supervisor    security     1        None      ✅ VALID
```

CSV format:
```bash
python scripts/list_users.py --csv
```

### Fix User Passwords

If users have invalid passwords (e.g., "dummy"), fix them:

```bash
cd backend
python scripts/fix_user_passwords.py
```

Dry run (see what would change):
```bash
python scripts/fix_user_passwords.py --dry-run
```

Custom password:
```bash
python scripts/fix_user_passwords.py --password mynewpassword
```

## 🔒 Security Notes

1. **Passwords are hashed**: All passwords are stored as bcrypt hashes, never in plain text
2. **Cannot retrieve passwords**: Once hashed, original passwords cannot be retrieved
3. **Change default password**: In production, change the default `password123` immediately
4. **Password requirements**: Consider adding password complexity requirements in production

## 📝 Production Checklist

- [ ] Change all default passwords
- [ ] Implement password complexity requirements
- [ ] Set up password reset functionality
- [ ] Enable account lockout after failed attempts
- [ ] Review and remove legacy auto-create mode
- [ ] Audit all user accounts

## 🚨 Important

**Never commit passwords to version control!**

All passwords should be:
- Set via environment variables in production
- Changed from defaults before deployment
- Managed through proper user management UI (future feature)

