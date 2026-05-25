package com.compraya.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String firebaseUid;   // Importante: clave de Firebase

    @Column(unique = true)
    private String email;

    private String name;
    private String phone;
    private String avatarUrl;
    private String city;  // Malabo, Bata, etc.

    private boolean isPremium = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime lastLogin;
}
package com.compraya.backend.repository;

import com.compraya.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByFirebaseUid(String firebaseUid);
    Optional<User> findByEmail(String email);
}