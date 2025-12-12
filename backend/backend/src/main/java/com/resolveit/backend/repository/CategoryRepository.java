// src/main/java/com/resolveit/backend/repository/CategoryRepository.java
package com.resolveit.backend.repository;

import com.resolveit.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByIsActiveTrue();
    Category findByCategoryName(String categoryName);
}