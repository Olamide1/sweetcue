# How to Apply SweetCue Fixes

## Step 1: Apply Database Schema Fixes

Since Docker isn't running, you'll need to apply the SQL fixes manually to your Supabase database.

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix-reminders-rls.sql` into the editor
4. Run the SQL script
5. Verify the policies were created successfully

### Option B: Using Supabase CLI (if Docker is available later)

```bash
# Start Docker Desktop first, then run:
npx supabase start
npx supabase db reset
```

## Step 2: Verify the Fixes

After applying the database fixes, test the following:

### Test 1: Create a Reminder
1. Open the app
2. Try to create a new reminder
3. Check the console for any errors
4. Verify the reminder appears in the list

### Test 2: Create a Gesture (Quick Gift)
1. Open the dashboard
2. Tap "Quick Gifts"
3. Select any gift option
4. Verify it creates both a gesture and reminder
5. Check that no RLS errors appear

### Test 3: Check Streak Calculation
1. Complete a few reminders
2. Verify the streak count updates correctly
3. Check that the progress bar shows accurate completed/missed counts

## Step 3: Debugging

If you still encounter issues:

### Check Console Logs
Open browser developer tools and look for:
- `[ReminderService]` logs
- `[GestureService]` logs  
- `[DashboardScreen]` logs
- Any error messages

### Common Issues and Solutions

1. **"Partner not found" error**
   - Ensure you have created a partner profile
   - Check that the partner belongs to the current user

2. **"User not authenticated" error**
   - Sign out and sign back in
   - Check that authentication is working

3. **RLS policy violations**
   - Verify the SQL policies were applied correctly
   - Check that the partner_id is being passed correctly

## Step 4: Manual Database Check

You can verify the RLS policies are working by running this query in Supabase:

```sql
-- Check if reminders policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reminders';

-- Check if gestures policies exist  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'gestures';
```

## Expected Results

After applying the fixes:

1. ✅ Reminders can be created without RLS errors
2. ✅ Gestures can be created without RLS errors  
3. ✅ Streak shows consecutive days with completed reminders
4. ✅ Progress bar shows accurate completed/missed counts
5. ✅ Quick gifts feature works properly
6. ✅ Send message feature works properly

## Files Modified

The following files have been updated with fixes:

- `fix-reminders-rls.sql` - New RLS policy fixes
- `src/services/reminders.ts` - Better error handling and validation
- `src/services/gestures.ts` - Better error handling and validation  
- `src/screens/dashboard/DashboardScreen.tsx` - Fixed streak calculation
- `RLS_FIXES_README.md` - Comprehensive documentation

## Next Steps

1. Apply the database schema fixes
2. Test all the features mentioned above
3. If issues persist, check the console logs for specific error messages
4. Report any remaining issues with the specific error messages 