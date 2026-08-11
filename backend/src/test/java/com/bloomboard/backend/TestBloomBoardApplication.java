package com.bloomboard.backend;

import org.springframework.boot.SpringApplication;

public class TestBloomBoardApplication {

	public static void main(String[] args) {
		SpringApplication.from(BloomBoardApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
