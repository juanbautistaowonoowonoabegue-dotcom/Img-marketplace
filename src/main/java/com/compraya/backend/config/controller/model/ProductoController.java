package com.example.demo.controller;

import com.example.demo.entity.Producto;
import com.example.demo.service.EstadisticasService;
import com.example.demo.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Esto permite que tus HTML se conecten sin bloqueos
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final EstadisticasService estadisticasService;

    // 1. Ver todos los productos en tu web
    @GetMapping("/productos")
    public List<Producto> getAll() {
        return productoRepository.findAll();
    }

    // 2. Filtrar por categoría (ej: "teléfonos")
    @GetMapping("/productos/categoria/{categoria}")
    public List<Producto> getByCategoria(@PathVariable String categoria) {
        return productoRepository.findByCategoria(categoria);
    }

    // 3. Ver los productos que son TENDENCIA (lo que calculamos antes)
    @GetMapping("/tendencias")
    public List<Producto> getTendencias(@RequestParam(defaultValue = "12") int limite) {
        return estadisticasService.calcularTendencias(limite);
    }

    // 4. Subir un nuevo producto a la tienda
    @PostMapping("/productos")
    public ResponseEntity<Producto> crearProducto(@RequestBody Producto producto) {
        Producto saved = productoRepository.save(producto);
        return ResponseEntity.ok(saved);
    }
}