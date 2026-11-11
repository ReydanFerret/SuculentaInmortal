function saveCollectionIfMissing(app, collection) {
    const collections = app.findAllCollections();
    for (let i = 0; i < collections.length; i++) {
        if (collections[i].name === collection.name) return;
    }
    app.save(collection);
}

migrate((app) => {
    const users = app.findCollectionByNameOrId("users");
    const plants = app.findCollectionByNameOrId("plantas");

    const needsReminderDefaults = !plants.fields.getByName("avisoriego");
    plants.fields.add(
        new TextField({ name: "ubicacion", max: 120 }),
        new BoolField({ name: "avisoriego" }),
        new BoolField({ name: "avisoabono" }),
        new TextField({ name: "horaaviso", max: 5, pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$" })
    );
    plants.createRule = '@request.auth.id != "" && user = @request.auth.id';
    app.save(plants);

    // Los BoolField nuevos tienen false como valor cero en SQLite. Las plantas
    // existentes deben conservar los avisos activados como antes de la migración.
    if (needsReminderDefaults) {
        app.db().newQuery("UPDATE plantas SET avisoriego = 1, avisoabono = 1, horaaviso = '09:00'").execute();
    }

    const ownerRule = '@request.auth.id != "" && user = @request.auth.id';
    const relatedOwnerRule = '@request.auth.id != "" && user = @request.auth.id && planta.user = @request.auth.id';
    const cuidados = new Collection({
        type: "base",
        name: "cuidados",
        listRule: ownerRule,
        viewRule: ownerRule,
        createRule: relatedOwnerRule,
        updateRule: relatedOwnerRule,
        deleteRule: ownerRule,
        fields: [
            { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
            { type: "relation", name: "planta", required: true, maxSelect: 1, collectionId: plants.id, cascadeDelete: true },
            { type: "select", name: "tipo", required: true, maxSelect: 1, values: ["riego", "fertilizacion", "fertilizacion_liquida"] },
            { type: "date", name: "fecha", required: true },
            { type: "text", name: "nota", max: 2000 }
        ],
        indexes: ["CREATE INDEX idx_cuidados_user_fecha ON cuidados (user, fecha)"]
    });
    saveCollectionIfMissing(app, cuidados);

    const diario = new Collection({
        type: "base",
        name: "diario",
        listRule: ownerRule,
        viewRule: ownerRule,
        createRule: relatedOwnerRule,
        updateRule: relatedOwnerRule,
        deleteRule: ownerRule,
        fields: [
            { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
            { type: "relation", name: "planta", required: true, maxSelect: 1, collectionId: plants.id, cascadeDelete: true },
            { type: "date", name: "fecha", required: true },
            { type: "text", name: "texto", required: true, max: 1200 },
            { type: "file", name: "foto", maxSelect: 1, maxSize: 10485760, mimeTypes: ["image/jpeg", "image/png", "image/webp"] }
        ],
        indexes: ["CREATE INDEX idx_diario_user_fecha ON diario (user, fecha)"]
    });
    saveCollectionIfMissing(app, diario);

    const ambiente = new Collection({
        type: "base",
        name: "mediciones_ambiente",
        listRule: ownerRule,
        viewRule: ownerRule,
        createRule: relatedOwnerRule,
        updateRule: relatedOwnerRule,
        deleteRule: ownerRule,
        fields: [
            { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
            { type: "relation", name: "planta", required: true, maxSelect: 1, collectionId: plants.id, cascadeDelete: true },
            { type: "date", name: "fecha", required: true },
            { type: "number", name: "temperatura" },
            { type: "number", name: "humedad" }
        ],
        indexes: ["CREATE INDEX idx_ambiente_user_fecha ON mediciones_ambiente (user, fecha)"]
    });
    saveCollectionIfMissing(app, ambiente);
});
