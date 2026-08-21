package com.erinson.calc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ErinsonCalc 计算后端启动类（JeecgBoot 单例模式单体应用）。
 */
@SpringBootApplication
public class ErinsonCalcApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErinsonCalcApplication.class, args);
    }
}