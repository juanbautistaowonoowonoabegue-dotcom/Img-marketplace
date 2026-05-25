package com.example.demo.repository;

import com.compraya.entity.Producto;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends MongoRepository<Producto, String> {
    List<Producto> findByCategoria(String categoria);
    List<Producto> findByEstado(String estado);
}