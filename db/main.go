// Consommateur q.db → PostgreSQL.
//
// Reçoit les messages produits (contrat commun à tous les importers), fait
// l'upsert du constructeur, du produit et de sa fiche typée. La clé naturelle
// d'un produit est (constructeur, référence).
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

// QueueMessage reflète le JSON publié par les importers. Les fiches typées
// sont des objets libres : chaque colonne connue est lue par son nom, les
// autres sont ignorées.
type QueueMessage struct {
    Name    string `json:"name"`
    Website string `json:"website"`
    Product struct {
        ProductType string          `json:"product_type"`
        Name        string          `json:"name"`
        Model       string          `json:"model"`
        SKU         string          `json:"sku"`
        GTIN        string          `json:"gtin"`
        IcecatID    *int            `json:"icecat_id"`
        Source      string          `json:"source"`
        ImageURL    string          `json:"image_url"`
        Warranty    string          `json:"warranty"`
        ScrapedURL  string          `json:"scraped_url"`
        DatasheetURL string         `json:"datasheet_url"`
        RawSpecs    json.RawMessage `json:"raw_specs"`

        Server      map[string]any `json:"server"`
        Switch      map[string]any `json:"switch"`
        Router      map[string]any `json:"router"`
        AccessPoint map[string]any `json:"access_point"`
    } `json:"product"`
}

func main() {
    ctx := context.Background()

    pgURL := os.Getenv("POSTGRES_URL")
    rabbitURL := os.Getenv("RABBITMQ_URL")
    queueName := os.Getenv("RABBITMQ_QUEUE")
    if pgURL == "" || rabbitURL == "" || queueName == "" {
        log.Fatal("Missing required environment variables")
    }

    db, err := pgxpool.New(ctx, pgURL)
    if err != nil {
        log.Fatal("DB connection error:", err)
    }
    defer db.Close()

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

    msgs, err := ch.Consume(queueName, "", true, false, false, false, nil)
    if err != nil {
        log.Fatal(err)
    }

    log.Println("DB consumer running. Waiting for messages...")

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

// ── helpers de lecture des fiches typées ─────────────────────────────────────

func nullStr(s string) any {
    if s == "" {
        return nil
    }
    return s
}

func getStr(m map[string]any, k string) any {
    if v, ok := m[k]; ok {
        if s, ok := v.(string); ok && s != "" {
            return s
        }
    }
    return nil
}

func getInt(m map[string]any, k string) any {
    if v, ok := m[k]; ok {
        switch n := v.(type) {
        case float64:
            return int(n)
        case int:
            return n
        }
    }
    return nil
}

func getBool(m map[string]any, k string) bool {
    if v, ok := m[k]; ok {
        if b, ok := v.(bool); ok {
            return b
        }
    }
    return false
}

// getJSON renvoie une valeur sérialisée pour une colonne Json, ou nil.
func getJSON(m map[string]any, k string) any {
    v, ok := m[k]
    if !ok || v == nil {
        return nil
    }
    b, err := json.Marshal(v)
    if err != nil {
        return nil
    }
    return b
}

func process(ctx context.Context, db *pgxpool.Pool, m QueueMessage) error {
    p := m.Product
    if m.Name == "" || p.SKU == "" || p.ProductType == "" {
        return fmt.Errorf("message incomplet (name=%q sku=%q type=%q)", m.Name, p.SKU, p.ProductType)
    }
    source := p.Source
    if source == "" {
        source = "unknown"
    }

    // 1. Constructeur
    var manufacturerID int
    err := db.QueryRow(ctx, `
        INSERT INTO "Manufacturer" (name, website, "createdAt", "updatedAt")
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
            website = CASE WHEN EXCLUDED.website <> '' THEN EXCLUDED.website ELSE "Manufacturer".website END,
            "updatedAt" = NOW()
        RETURNING id;
    `, m.Name, m.Website).Scan(&manufacturerID)
    if err != nil {
        return fmt.Errorf("manufacturer upsert failed: %w", err)
    }

    // 2. Produit — clé naturelle (constructeur, référence)
    var rawSpecs any
    if len(p.RawSpecs) > 0 && string(p.RawSpecs) != "null" {
        rawSpecs = []byte(p.RawSpecs)
    }
    var productID int
    err = db.QueryRow(ctx, `
        INSERT INTO "Product" (
            manufacturer_id, product_type, name, model, sku, gtin, icecat_id, source,
            image_url, warranty, scraped_url, datasheet_url, raw_specs, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $12, $4, $5, $6, $7, $8, $9, $10, $13, $11, NOW(), NOW())
        ON CONFLICT (manufacturer_id, sku) DO UPDATE SET
            product_type = EXCLUDED.product_type,
            name         = EXCLUDED.name,
            model        = COALESCE(EXCLUDED.model, "Product".model),
            gtin         = COALESCE(EXCLUDED.gtin, "Product".gtin),
            icecat_id    = COALESCE(EXCLUDED.icecat_id, "Product".icecat_id),
            source       = EXCLUDED.source,
            image_url    = COALESCE(EXCLUDED.image_url, "Product".image_url),
            warranty     = COALESCE(EXCLUDED.warranty, "Product".warranty),
            scraped_url  = COALESCE(EXCLUDED.scraped_url, "Product".scraped_url),
            datasheet_url = COALESCE(EXCLUDED.datasheet_url, "Product".datasheet_url),
            raw_specs    = COALESCE(EXCLUDED.raw_specs, "Product".raw_specs),
            "updatedAt"  = NOW()
        RETURNING id;
    `,
        manufacturerID, p.ProductType, p.Name, p.SKU, nullStr(p.GTIN), p.IcecatID, source,
        nullStr(p.ImageURL), nullStr(p.Warranty), nullStr(p.ScrapedURL), rawSpecs, nullStr(p.Model), nullStr(p.DatasheetURL),
    ).Scan(&productID)
    if err != nil {
        return fmt.Errorf("product upsert failed: %w", err)
    }

    // 3. Fiche typée
    switch p.ProductType {
    case "server":
        err = upsertServer(ctx, db, productID, p.Server)
    case "switch":
        err = upsertSwitch(ctx, db, productID, p.Switch)
    case "router":
        err = upsertRouter(ctx, db, productID, p.Router)
    case "access_point":
        err = upsertAccessPoint(ctx, db, productID, p.AccessPoint)
    default:
        // Type sans table dédiée : la fiche vit dans Product + raw_specs.
    }
    if err != nil {
        return err
    }

    log.Printf("✔ %s — %s %s (%s)", p.ProductType, m.Name, p.Name, source)
    return nil
}

func upsertServer(ctx context.Context, db *pgxpool.Pool, id int, s map[string]any) error {
    if s == nil {
        s = map[string]any{}
    }
    _, err := db.Exec(ctx, `
        INSERT INTO "Product_server" (
            product_id, cpu_model, cpu_cores, cpu_frequency, cpu_socket,
            ram_gb, ram_type, ram_max_gb, ram_slots_total, ram_slots_available,
            storage_slots_total, storage_bays, storage_capacity, storage_connector,
            rack_units, case_format, server_format, lan_ports, power_watts, redundant_psu,
            front_connectors, rear_connectors, barebone, os_included,
            height_mm, width_mm, depth_mm
        ) VALUES (
            $1,$2,$3,$4,$5, $6,$7,$8,$9,$10, $11,$12,$13,$14,
            $15,$16,$17,$18,$19,$20, $21,$22,$23,$24, $25,$26,$27
        )
        ON CONFLICT (product_id) DO UPDATE SET
            cpu_model = EXCLUDED.cpu_model, cpu_cores = EXCLUDED.cpu_cores,
            cpu_frequency = EXCLUDED.cpu_frequency, cpu_socket = EXCLUDED.cpu_socket,
            ram_gb = EXCLUDED.ram_gb, ram_type = EXCLUDED.ram_type, ram_max_gb = EXCLUDED.ram_max_gb,
            ram_slots_total = EXCLUDED.ram_slots_total, ram_slots_available = EXCLUDED.ram_slots_available,
            storage_slots_total = EXCLUDED.storage_slots_total, storage_bays = EXCLUDED.storage_bays,
            storage_capacity = EXCLUDED.storage_capacity, storage_connector = EXCLUDED.storage_connector,
            rack_units = EXCLUDED.rack_units, case_format = EXCLUDED.case_format,
            server_format = EXCLUDED.server_format, lan_ports = EXCLUDED.lan_ports,
            power_watts = EXCLUDED.power_watts, redundant_psu = EXCLUDED.redundant_psu,
            front_connectors = EXCLUDED.front_connectors, rear_connectors = EXCLUDED.rear_connectors,
            barebone = EXCLUDED.barebone, os_included = EXCLUDED.os_included,
            height_mm = EXCLUDED.height_mm, width_mm = EXCLUDED.width_mm, depth_mm = EXCLUDED.depth_mm
    `,
        id, getStr(s, "cpu_model"), getInt(s, "cpu_cores"), getStr(s, "cpu_frequency"), getStr(s, "cpu_socket"),
        getInt(s, "ram_gb"), getStr(s, "ram_type"), getInt(s, "ram_max_gb"), getInt(s, "ram_slots_total"), getInt(s, "ram_slots_available"),
        getInt(s, "storage_slots_total"), getJSON(s, "storage_bays"), getStr(s, "storage_capacity"), getStr(s, "storage_connector"),
        getInt(s, "rack_units"), getStr(s, "case_format"), getStr(s, "server_format"), getJSON(s, "lan_ports"), getInt(s, "power_watts"), getBool(s, "redundant_psu"),
        getJSON(s, "front_connectors"), getJSON(s, "rear_connectors"), getBool(s, "barebone"), getBool(s, "os_included"),
        getInt(s, "height_mm"), getInt(s, "width_mm"), getInt(s, "depth_mm"),
    )
    if err != nil {
        return fmt.Errorf("product_server upsert failed: %w", err)
    }
    return nil
}

func upsertSwitch(ctx context.Context, db *pgxpool.Pool, id int, s map[string]any) error {
    if s == nil {
        s = map[string]any{}
    }
    _, err := db.Exec(ctx, `
        INSERT INTO "Product_switch" (
            product_id, lan_ports, console_port, switching_capacity_gbps, layer, managed,
            stacking, vlan_support, poe_support, poe_budget_watts, rack_units, power_watts,
            redundant_psu, height_mm, width_mm, depth_mm
        ) VALUES ($1,$2,$3,$4,$5,$6, $7,$8,$9,$10,$11,$12, $13,$14,$15,$16)
        ON CONFLICT (product_id) DO UPDATE SET
            lan_ports = EXCLUDED.lan_ports, console_port = EXCLUDED.console_port,
            switching_capacity_gbps = EXCLUDED.switching_capacity_gbps, layer = EXCLUDED.layer,
            managed = EXCLUDED.managed, stacking = EXCLUDED.stacking, vlan_support = EXCLUDED.vlan_support,
            poe_support = EXCLUDED.poe_support, poe_budget_watts = EXCLUDED.poe_budget_watts,
            rack_units = EXCLUDED.rack_units, power_watts = EXCLUDED.power_watts,
            redundant_psu = EXCLUDED.redundant_psu,
            height_mm = EXCLUDED.height_mm, width_mm = EXCLUDED.width_mm, depth_mm = EXCLUDED.depth_mm
    `,
        id, getJSON(s, "lan_ports"), getBool(s, "console_port"), getInt(s, "switching_capacity_gbps"), getInt(s, "layer"), getBool(s, "managed"),
        getBool(s, "stacking"), getBool(s, "vlan_support"), getBool(s, "poe_support"), getInt(s, "poe_budget_watts"), getInt(s, "rack_units"), getInt(s, "power_watts"),
        getBool(s, "redundant_psu"), getInt(s, "height_mm"), getInt(s, "width_mm"), getInt(s, "depth_mm"),
    )
    if err != nil {
        return fmt.Errorf("product_switch upsert failed: %w", err)
    }
    return nil
}

func upsertRouter(ctx context.Context, db *pgxpool.Pool, id int, s map[string]any) error {
    if s == nil {
        s = map[string]any{}
    }
    _, err := db.Exec(ctx, `
        INSERT INTO "Product_router" (
            product_id, wan_ports, modem_type, modem_integrated, lan_ports, console_port,
            wifi_standard, layer, managed, vlan_support, vpn_support, max_throughput_mbps,
            poe_support, poe_budget_watts, rack_units, power_watts, redundant_psu,
            height_mm, width_mm, depth_mm
        ) VALUES ($1,$2,$3,$4,$5,$6, $7,$8,$9,$10,$11,$12, $13,$14,$15,$16,$17, $18,$19,$20)
        ON CONFLICT (product_id) DO UPDATE SET
            wan_ports = EXCLUDED.wan_ports, modem_type = EXCLUDED.modem_type,
            modem_integrated = EXCLUDED.modem_integrated, lan_ports = EXCLUDED.lan_ports,
            console_port = EXCLUDED.console_port, wifi_standard = EXCLUDED.wifi_standard,
            layer = EXCLUDED.layer, managed = EXCLUDED.managed, vlan_support = EXCLUDED.vlan_support,
            vpn_support = EXCLUDED.vpn_support, max_throughput_mbps = EXCLUDED.max_throughput_mbps,
            poe_support = EXCLUDED.poe_support, poe_budget_watts = EXCLUDED.poe_budget_watts,
            rack_units = EXCLUDED.rack_units, power_watts = EXCLUDED.power_watts,
            redundant_psu = EXCLUDED.redundant_psu,
            height_mm = EXCLUDED.height_mm, width_mm = EXCLUDED.width_mm, depth_mm = EXCLUDED.depth_mm
    `,
        id, getJSON(s, "wan_ports"), getStr(s, "modem_type"), getBool(s, "modem_integrated"), getJSON(s, "lan_ports"), getBool(s, "console_port"),
        getStr(s, "wifi_standard"), getInt(s, "layer"), getBool(s, "managed"), getBool(s, "vlan_support"), getBool(s, "vpn_support"), getInt(s, "max_throughput_mbps"),
        getBool(s, "poe_support"), getInt(s, "poe_budget_watts"), getInt(s, "rack_units"), getInt(s, "power_watts"), getBool(s, "redundant_psu"),
        getInt(s, "height_mm"), getInt(s, "width_mm"), getInt(s, "depth_mm"),
    )
    if err != nil {
        return fmt.Errorf("product_router upsert failed: %w", err)
    }
    return nil
}

func upsertAccessPoint(ctx context.Context, db *pgxpool.Pool, id int, s map[string]any) error {
    if s == nil {
        s = map[string]any{}
    }
    _, err := db.Exec(ctx, `
        INSERT INTO "Product_access_point" (
            product_id, wifi_standard, max_throughput_mbps, ethernet_ports, poe_support,
            poe_in, antennas, mu_mimo, mounting, power_watts, outdoor
        ) VALUES ($1,$2,$3,$4,$5, $6,$7,$8,$9,$10,$11)
        ON CONFLICT (product_id) DO UPDATE SET
            wifi_standard = EXCLUDED.wifi_standard, max_throughput_mbps = EXCLUDED.max_throughput_mbps,
            ethernet_ports = EXCLUDED.ethernet_ports, poe_support = EXCLUDED.poe_support,
            poe_in = EXCLUDED.poe_in, antennas = EXCLUDED.antennas, mu_mimo = EXCLUDED.mu_mimo,
            mounting = EXCLUDED.mounting, power_watts = EXCLUDED.power_watts, outdoor = EXCLUDED.outdoor
    `,
        id, getStr(s, "wifi_standard"), getInt(s, "max_throughput_mbps"), getInt(s, "ethernet_ports"), getBool(s, "poe_support"),
        getBool(s, "poe_in"), getInt(s, "antennas"), getStr(s, "mu_mimo"), getStr(s, "mounting"), getInt(s, "power_watts"), getBool(s, "outdoor"),
    )
    if err != nil {
        return fmt.Errorf("product_access_point upsert failed: %w", err)
    }
    return nil
}
