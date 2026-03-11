package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "os"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/rabbitmq/amqp091-go"
)

type QueueMessage struct {
    Name    string `json:"name"`
    Website string `json:"website"`
    Product struct {
        ProductType string `json:"product_type"`
        Name        string `json:"name"`
        SKU         string `json:"sku"`
        Warranty    string `json:"warranty"`
        ScrapedURL  string `json:"scraped_url"`
        Server      struct {
            CPUModel          string      `json:"cpu_model"`
            CPUCores          int         `json:"cpu_cores"`
            CPUFrequency      string      `json:"cpu_frequency"`
            CPUSocket         string      `json:"cpu_socket"`
            RAMGB             int         `json:"ram_gb"`
            RAMType           string      `json:"ram_type"`
            RAMMaxGB          int         `json:"ram_max_gb"`
            RAMSlotsTotal     int         `json:"ram_slots_total"`
            RAMSlotsAvailable int         `json:"ram_slots_available"`
            StorageSlotsTotal int         `json:"storage_slots_total"`
            StorageBays       any         `json:"storage_bays"`
            StorageCapacity   string      `json:"storage_capacity"`
            StorageConnector  string      `json:"storage_connector"`
            RackUnits         int         `json:"rack_units"`
            CaseFormat        string      `json:"case_format"`
            ServerFormat      string      `json:"server_format"`
            PowerWatts        int         `json:"power_watts"`
            RedundantPSU      bool        `json:"redundant_psu"`
            FrontConnectors   any         `json:"front_connectors"`
            RearConnectors    any         `json:"rear_connectors"`
            Barebone          bool        `json:"barebone"`
            OSIncluded        bool        `json:"os_included"`
            HeightMM          int         `json:"height_mm"`
            WidthMM           int         `json:"width_mm"`
            DepthMM           int         `json:"depth_mm"`
        } `json:"server"`
    } `json:"product"`
}

func main() {
    ctx := context.Background()

    // Load env variables
    pgURL := os.Getenv("POSTGRES_URL")
    rabbitURL := os.Getenv("RABBITMQ_URL")
    queueName := os.Getenv("RABBITMQ_QUEUE")

    if pgURL == "" || rabbitURL == "" || queueName == "" {
        log.Fatal("Missing required environment variables")
    }

    // Connect to PostgreSQL
    db, err := pgxpool.New(ctx, pgURL)
    if err != nil {
        log.Fatal("DB connection error:", err)
    }
    defer db.Close()

    // Connect to RabbitMQ
    conn, err := amqp091.Dial(rabbitURL)
    if err != nil {
        log.Fatal("RabbitMQ connection error:", err)
    }
    defer conn.Close()

    ch, err := conn.Channel()
    if err != nil {
        log.Fatal(err)
    }
    defer ch.Close()

    msgs, err := ch.Consume(
        queueName,
        "",
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }

    log.Println("Orchestrator running. Waiting for messages...")

    for msg := range msgs {
        var payload QueueMessage
        if err := json.Unmarshal(msg.Body, &payload); err != nil {
            log.Println("Invalid JSON:", err)
            continue
        }

        if err := process(ctx, db, payload); err != nil {
            log.Println("Error:", err)
        }
    }
}

func process(ctx context.Context, db *pgxpool.Pool, m QueueMessage) error {
    // 1. UPSERT MANUFACTURER
    var manufacturerID int
    err := db.QueryRow(ctx, `
        INSERT INTO "Manufacturer" (name, website, "createdAt", "updatedAt")
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
            website = EXCLUDED.website,
            "updatedAt" = NOW()
        RETURNING id;
    `, m.Name, m.Website).Scan(&manufacturerID)

    if err != nil {
        return fmt.Errorf("manufacturer upsert failed: %w", err)
    }

    // 2. UPSERT PRODUCT
    var productID int
    err = db.QueryRow(ctx, `
        INSERT INTO "Product" (
            manufacturer_id, product_type, name, sku, warranty, scraped_url,
            "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            warranty = EXCLUDED.warranty,
            scraped_url = EXCLUDED.scraped_url,
            "updatedAt" = NOW()
        RETURNING id;
    `,
        manufacturerID,
        m.Product.ProductType,
        m.Product.Name,
        m.Product.SKU,
        m.Product.Warranty,
        m.Product.ScrapedURL,
    ).Scan(&productID)
    if err != nil {
        return fmt.Errorf("product upsert failed: %w", err)
    }

    // 3. UPSERT PRODUCT_SERVER
    s := m.Product.Server

    storageBaysJSON, _ := json.Marshal(s.StorageBays)
    frontJSON, _ := json.Marshal(s.FrontConnectors)
    rearJSON, _ := json.Marshal(s.RearConnectors)

    _, err = db.Exec(ctx, `
        INSERT INTO "Product_server" (
            product_id, cpu_model, cpu_cores, cpu_frequency, cpu_socket,
            ram_gb, ram_type, ram_max_gb, ram_slots_total, ram_slots_available,
            storage_slots_total, storage_bays, storage_capacity, storage_connector,
            rack_units, case_format, server_format, power_watts, redundant_psu,
            front_connectors, rear_connectors, barebone, os_included,
            height_mm, width_mm, depth_mm
        )
        VALUES (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9,$10,
            $11,$12,$13,$14,
            $15,$16,$17,$18,$19,
            $20,$21,$22,$23,
            $24,$25,$26
        )
        ON CONFLICT (product_id) DO UPDATE SET
            cpu_model = EXCLUDED.cpu_model,
            cpu_cores = EXCLUDED.cpu_cores,
            cpu_frequency = EXCLUDED.cpu_frequency,
            cpu_socket = EXCLUDED.cpu_socket,
            ram_gb = EXCLUDED.ram_gb,
            ram_type = EXCLUDED.ram_type,
            ram_max_gb = EXCLUDED.ram_max_gb,
            ram_slots_total = EXCLUDED.ram_slots_total,
            ram_slots_available = EXCLUDED.ram_slots_available,
            storage_slots_total = EXCLUDED.storage_slots_total,
            storage_bays = EXCLUDED.storage_bays,
            storage_capacity = EXCLUDED.storage_capacity,
            storage_connector = EXCLUDED.storage_connector,
            rack_units = EXCLUDED.rack_units,
            case_format = EXCLUDED.case_format,
            server_format = EXCLUDED.server_format,
            power_watts = EXCLUDED.power_watts,
            redundant_psu = EXCLUDED.redundant_psu,
            front_connectors = EXCLUDED.front_connectors,
            rear_connectors = EXCLUDED.rear_connectors,
            barebone = EXCLUDED.barebone,
            os_included = EXCLUDED.os_included,
            height_mm = EXCLUDED.height_mm,
            width_mm = EXCLUDED.width_mm,
            depth_mm = EXCLUDED.depth_mm
    `,
        productID, s.CPUModel, s.CPUCores, s.CPUFrequency, s.CPUSocket,
        s.RAMGB, s.RAMType, s.RAMMaxGB, s.RAMSlotsTotal, s.RAMSlotsAvailable,
        s.StorageSlotsTotal, storageBaysJSON, s.StorageCapacity, s.StorageConnector,
        s.RackUnits, s.CaseFormat, s.ServerFormat, s.PowerWatts, s.RedundantPSU,
        frontJSON, rearJSON, s.Barebone, s.OSIncluded,
        s.HeightMM, s.WidthMM, s.DepthMM,
    )

    if err != nil {
        return fmt.Errorf("product_server upsert failed: %w", err)
    }

    log.Println("✔ Updated:", m.Product.Name)
    return nil
}
