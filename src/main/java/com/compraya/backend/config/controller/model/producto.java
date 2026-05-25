package com.example.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Document(collection = "usuarios")
public class Usuario {
    @Id
    private String uid;                    // Firebase UID
    private String nombre;
    private String email;
    private String telefono;
    private int seguidores;
    private int seguidos;
    private List<String> comunidades;      // IDs de comunidades
    private long ventasTotales;
    private int productosPublicados;
    private String planType;               // "basic" o "premium"
}