import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

public class TestToken {
    public static void main(String[] args) {
        String token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3MTY1Njk0MywiZXhwIjoxNzcyMjYxNzQzfQ.KoXn9XTNp-fzWwdoOV2AwWmyltTjcEHy6Earpi1YfWmOIzdre8FxjGmKy7721QLc5eydon55ciwL_YgwWmHT3Q";
        String secret = "change-this-super-long-jwt-secret-change-this-super-long-jwt-secret";
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            String username = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
            System.out.println("Username: " + username);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
