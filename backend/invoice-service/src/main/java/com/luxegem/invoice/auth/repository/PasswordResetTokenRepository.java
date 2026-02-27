package com.luxegem.invoice.auth.repository;

import com.luxegem.invoice.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByTokenAndUser(String token, com.luxegem.invoice.auth.entity.AppUser user);

    void deleteByUser_Id(Long userId);
}
