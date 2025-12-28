# Database Migration Troubleshooting Guide

## Common Errors and Solutions

### Error: "column does not exist"
**Solution**: Make the operation conditional:
```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'table_name' 
    AND column_name = 'column_name'
  ) THEN
    -- Your operation here
  END IF;
END $$;
```

### Error: "foreign key constraint cannot be implemented - incompatible types"
**Solution**: Check column types before adding foreign key:
```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' 
    AND column_name = 'id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE ... ADD CONSTRAINT ...;
  END IF;
END $$;
```

### Error: "relation does not exist"
**Solution**: Check if table exists before referencing:
```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'table_name'
  ) THEN
    -- Your operation here
  END IF;
END $$;
```

### Error: "constraint already exists"
**Solution**: Drop constraint first, then add:
```sql
ALTER TABLE table_name DROP CONSTRAINT IF EXISTS constraint_name;
ALTER TABLE table_name ADD CONSTRAINT constraint_name ...;
```

## Recommended Approach

### Option 1: Run Migration in Sections
Break the migration into smaller parts:
1. Add columns to existing tables
2. Create new tables (without foreign keys)
3. Add foreign keys separately
4. Create functions
5. Create indexes

### Option 2: Manual Creation
1. Use Supabase Dashboard to create tables
2. Add columns manually
3. Run functions separately
4. Add constraints last

### Option 3: Fix Errors One by One
1. Run full migration
2. When error occurs, note the line number
3. Fix that specific section
4. Continue from that point

## Migration File Structure

The migration file has these sections:
1. ✅ PostGIS extension
2. ✅ Profiles table updates
3. ✅ Emergency contacts table
4. ✅ Incidents table updates
5. ✅ Emergency service logs
6. ✅ Incident chat
7. ✅ Notification queue
8. ✅ Point transactions
9. ✅ Functions
10. ✅ Indexes

## Testing Each Section

You can test each section independently:

```sql
-- Test section 1
CREATE EXTENSION IF NOT EXISTS postgis;

-- Test section 2
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
-- etc.
```

## Quick Fixes Applied

✅ Fixed `ALTER PUBLICATION` syntax
✅ Made `check_in_timers` reference conditional
✅ Made `type` column constraint conditional
✅ Made location index conditional
✅ Made all foreign keys conditional

## Next Steps

1. Try running migration again
2. If errors persist, run section by section
3. Fix errors as they appear
4. Document any new errors for next session

