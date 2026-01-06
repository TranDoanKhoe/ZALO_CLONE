package vn.edu.iuh.fit.zalo_app_be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class ZaloAppBeApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZaloAppBeApplication.class, args);
    }

}
