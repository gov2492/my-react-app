# Java 21 LTS Upgrade Plan

## Project Overview
- **Current Java Version:** 17
- **Target Java Version:** 21 (LTS)
- **Spring Boot Version:** 3.3.5 (already compatible with Java 21)
- **Build Tool:** Maven (multi-module project)
- **Project Structure:** Microservices architecture with 4 services

## Services to Upgrade
1. auth-service (Java 17 → 21)
2. dashboard-service (Java 17 → 21)
3. invoice-service (Java 17 → 21)
4. market-service (Java 17 → 21)

## Upgrade Strategy

### Phase 1: Environment Preparation
- Verify Java 21 JDK is installed on the system
- Ensure Maven is installed and properly configured
- Set up version control branch for tracking changes (optional but recommended)

### Phase 2: Update Configuration Files
For each microservice pom.xml file, update the `<java.version>` property:

**Files to modify:**
- `/Users/anjali/my-react-app/backend/auth-service/pom.xml`
- `/Users/anjali/my-react-app/backend/dashboard-service/pom.xml`
- `/Users/anjali/my-react-app/backend/invoice-service/pom.xml`
- `/Users/anjali/my-react-app/backend/market-service/pom.xml`

**Change pattern:**
```xml
OLD:
<java.version>17</java.version>

NEW:
<java.version>21</java.version>
```

### Phase 3: Dependency Review
- Spring Boot 3.3.5 is fully compatible with Java 21
- No dependency version changes are required
- All current dependencies support Java 21

### Phase 4: Build and Verification
- Clean build: `mvn clean install`
- Compile check for each service
- Address any compilation errors or warnings
- Run existing test suites to ensure functional equivalence

### Phase 5: Runtime Testing
- Start each microservice and verify startup
- Test API endpoints to ensure functionality
- Verify Spring Boot logs for any deprecation warnings
- Check for any unexpected runtime behavior

## Expected Changes
- **Compilation Target:** Updated from Java 17 to Java 21 bytecode
- **Runtime Behavior:** Should remain identical (no breaking changes)
- **Dependencies:** No changes needed
- **Configuration:** Only java.version property needs updating

## Rollback Plan
If issues arise:
- Revert `<java.version>` back to 17 in all pom.xml files
- Run `mvn clean install` to rebuild
- Restart services

## Notes
- Java 21 is an LTS release (Long-Term Support until September 2026)
- Features from Java 18-21 are now available
- Virtual threads (Project Loom) are available but require explicit opt-in
- Pattern matching and other language enhancements are available

## Success Criteria
✓ All services compile successfully with Java 21
✓ All services start without errors
✓ API endpoints respond correctly
✓ No functional regression detected
✓ No deprecation warnings from Spring Boot/Java
