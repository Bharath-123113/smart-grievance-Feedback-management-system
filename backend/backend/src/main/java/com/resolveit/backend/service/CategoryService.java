// src/main/java/com/resolveit/backend/service/CategoryService.java
package com.resolveit.backend.service;

import com.resolveit.backend.entity.Category;
import com.resolveit.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    public List<Category> getAllActiveCategories() {
        return categoryRepository.findByIsActiveTrue();
    }
    
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id).orElse(null);
    }
    
    public Category getCategoryByName(String name) {
        return categoryRepository.findByCategoryName(name);
    }
}