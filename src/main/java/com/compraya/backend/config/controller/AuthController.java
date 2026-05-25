package com.compraya.backend.controller;

import com.compraya.backend.model.User;
import com.compraya.backend.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestBody Map<String, String> request) {
        try {
            String idToken = request.get("idToken");
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);

            User user = userRepository.findByFirebaseUid(decodedToken.getUid())
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setFirebaseUid(decodedToken.getUid());
                        newUser.setEmail(decodedToken.getEmail());
                        newUser.setName(decodedToken.getName());
                        newUser.setAvatarUrl(decodedToken.getPicture());
                        return newUser;
                    });

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "user", user,
                "message", "Usuario autenticado correctamente"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}