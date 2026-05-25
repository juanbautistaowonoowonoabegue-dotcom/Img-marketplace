package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FirebaseConfig {
    public static void main(String[] args) {
        SpringApplication.run(FirebaseConfig.class, args);
    }
}
// ================================================
// FirebaseConfig.java
// Configuración profesional de Firebase Admin SDK
// Compra Ya Marketplace - Guinea Ecuatorial
// ================================================

package com.example.demo.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            // Ruta relativa desde la raíz del proyecto (ajusta si es necesario)
            FileInputStream serviceAccount = 
                new FileInputStream("serviceAccountKey.json");

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    // Opcional: si usas Realtime Database
                    // .setDatabaseUrl("https://compraya-d0760.firebaseio.com/")
                    .build();

            FirebaseApp.initializeApp(options);

            System.out.println("✅ Firebase Admin SDK inicializado correctamente en Spring Boot");
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth() {
        return FirebaseAuth.getInstance();
    }

    @Bean
    public com.google.cloud.firestore.Firestore firestore() {
        return FirestoreClient.getFirestore();
    }
}