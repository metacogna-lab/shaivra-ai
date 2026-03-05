Run the test suite and, if it fails, write failures to a timestamped file in tasks/.

1. Run: `bun run test 2>&1`
2. If exit code is non-zero, create `tasks/$(date +%Y%m%d-%H%M%S)-errors.md` with:
   - Timestamp and command
   - Failing test file, describe/it, and error message
   - Category: assertion failure, timeout, mock not applied, missing env, type error
3. Update `tasks/bridge.md` with a short "Test run" note and link to the errors file.

Use this for repetitive "run tests and record errors" workflow during initphase or before merge.
