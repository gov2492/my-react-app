package com.luxegem.auth.repository;

import com.luxegem.auth.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByTokenAndUser(String token, com.luxegem.auth.model.AppUser user);

    void deleteByUser_Id(Long userId);
}
