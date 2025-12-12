// src/main/java/com/resolveit/backend/repository/DepartmentRepository.java
package com.resolveit.backend.repository;

import com.resolveit.backend.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findAll();
    Department findByDepartmentCode(String departmentCode);
    boolean existsByDepartmentCode(String departmentCode);
}