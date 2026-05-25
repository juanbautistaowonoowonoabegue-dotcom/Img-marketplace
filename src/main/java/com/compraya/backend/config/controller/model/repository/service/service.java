package com.example.demo.service;

import com.example.demo.entity.Producto;
import com.example.demo.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstadisticasService {

    private final ProductoRepository productoRepository;

    // Tu algoritmo para calcular qué productos salen en "Tendencias"
    public List<Producto> calcularTendencias(int limite) {
        List<Producto> todos = productoRepository.findAll();

        return todos.stream()
                .map(p -> {
                    // Calculamos un "score" de popularidad
                    double score = (p.getVentasHoy() * 4.0) + (p.getVistas() * 1.5) + (p.getFavoritos() * 2.0);
                    
                    // Si el vendedor es "premium", le damos un empujón en el ranking
                    if ("premium".equals(p.getEstado())) score *= 1.3;
                    
                    p.setVentasHoy((int) score); // Guardamos el score temporalmente
                    return p;
                })
                .sorted(Comparator.comparingDouble(p -> -p.getVentasHoy())) // Los más populares primero
                .limit(limite)
                .collect(Collectors.toList());
    }
}