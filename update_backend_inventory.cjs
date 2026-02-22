const fs = require('fs');

function modifyFile(filepath, replaces) {
    if (!fs.existsSync(filepath)) {
        console.error('Not found:', filepath);
        return;
    }
    let content = fs.readFileSync(filepath, 'utf8');
    for (const { from, to } of replaces) {
        if (typeof from === 'string') {
            content = content.replace(new RegExp(from, 'g'), to);
        } else {
            content = content.replace(from, to);
        }
    }
    fs.writeFileSync(filepath, content);
    console.log('Modified:', filepath);
}

// 1. InventoryEntity in invoice-service
const entityPath = 'backend/invoice-service/src/main/java/com/luxegem/invoice/entity/InventoryEntity.java';
modifyFile(entityPath, [
    { from: /@Column\(nullable = false\)\s*private String purity;/g, to: '@Column\n    private String purity;' },
    { from: /@Column\(nullable = false, precision = 10, scale = 3\)\s*private BigDecimal grossWeight;\s*/g, to: '' },
    { from: /@Column\(precision = 10, scale = 3\)\s*private BigDecimal netWeight;\s*/g, to: '' },
    { from: /@Column\(precision = 10, scale = 2\)\s*private BigDecimal makingCharge;\s*/g, to: '' },
    { from: /@Column\(nullable = false, precision = 12, scale = 2\)\s*private BigDecimal ratePerGram;\s*/g, to: '' },
    { from: /@Column\(nullable = false\)\s*private Integer stockQuantity;\s*/g, to: '' },
    { from: /private String hsnCode;\s*/g, to: '' },
    { from: /BigDecimal grossWeight,\s*BigDecimal netWeight,\s*BigDecimal makingCharge,\s*BigDecimal ratePerGram,\s*Integer stockQuantity,\s*String hsnCode,\s*/g, to: '' },
    { from: /this\.grossWeight = grossWeight;\s*this\.netWeight = netWeight;\s*this\.makingCharge = makingCharge;\s*this\.ratePerGram = ratePerGram;\s*this\.stockQuantity = stockQuantity;\s*this\.hsnCode = hsnCode;\s*/g, to: '' }
]);
let entContent = fs.readFileSync(entityPath, 'utf8');
entContent = entContent.replace(/public BigDecimal getGrossWeight\(\) \{[\s\S]*?public void setHsnCode\(String hsnCode\) \{\s*this\.hsnCode = hsnCode;\s*\}/, '');
fs.writeFileSync(entityPath, entContent);

// 2. CreateInventoryRequest (invoice & dashboard)
const reqFiles = [
    'backend/invoice-service/src/main/java/com/luxegem/invoice/model/CreateInventoryRequest.java',
    'backend/dashboard-service/src/main/java/com/luxegem/dashboard/model/CreateInventoryRequest.java'
];
for (const file of reqFiles) {
    modifyFile(file, [
        { from: /import java\.math\.BigDecimal;\n/g, to: '' },
        { from: /import jakarta\.validation\.constraints\.Min;\n/g, to: '' },
        { from: /@NotNull @Min\(0\) BigDecimal grossWeight,\s*BigDecimal netWeight,\s*BigDecimal makingCharge,\s*@NotNull @Min\(0\) BigDecimal ratePerGram,\s*@NotNull @Min\(0\) Integer stockQuantity,\s*String hsnCode,\s*/g, to: '' }
    ]);
}

// 3. InventoryResponse (invoice & dashboard)
const resFiles = [
    'backend/invoice-service/src/main/java/com/luxegem/invoice/model/InventoryResponse.java',
    'backend/dashboard-service/src/main/java/com/luxegem/dashboard/model/InventoryResponse.java'
];
for (const file of resFiles) {
    modifyFile(file, [
        { from: /double grossWeight,\s*Double netWeight,\s*Double makingCharge,\s*double ratePerGram,\s*int stockQuantity,\s*String hsnCode,\s*/g, to: '' },
        { from: /request\.grossWeight\(\),\s*request\.netWeight\(\),\s*request\.makingCharge\(\),\s*request\.ratePerGram\(\),\s*request\.stockQuantity\(\),\s*request\.hsnCode\(\),\s*/g, to: '' },
        { from: /entity\.getGrossWeight\(\)\.doubleValue\(\),\s*entity\.getNetWeight\(\) != null \? entity\.getNetWeight\(\)\.doubleValue\(\) : null,\s*entity\.getMakingCharge\(\) != null \? entity\.getMakingCharge\(\)\.doubleValue\(\) : null,\s*entity\.getRatePerGram\(\)\.doubleValue\(\),\s*entity\.getStockQuantity\(\),\s*entity\.getHsnCode\(\),\s*/g, to: '' }
    ]);
}

// 4. InventoryItemResponse (invoice)
const itemResFile = 'backend/invoice-service/src/main/java/com/luxegem/invoice/model/InventoryItemResponse.java';
modifyFile(itemResFile, [
    { from: /double grossWeight,\s*Double netWeight,\s*Double makingCharge,\s*double ratePerGram,\s*int stockQuantity,\s*String hsnCode,\s*/g, to: '' }
]);

// 5. InventoryController (invoice)
const ctrlFile = 'backend/invoice-service/src/main/java/com/luxegem/invoice/controller/InventoryController.java';
modifyFile(ctrlFile, [
    { from: /request\.grossWeight\(\),\s*request\.netWeight\(\),\s*request\.makingCharge\(\),\s*request\.ratePerGram\(\),\s*request\.stockQuantity\(\),\s*request\.hsnCode\(\),\s*/g, to: '' },
    { from: /entity\.getGrossWeight\(\)\.doubleValue\(\),\s*entity\.getNetWeight\(\) != null \? entity\.getNetWeight\(\)\.doubleValue\(\) : null,\s*entity\.getMakingCharge\(\) != null \? entity\.getMakingCharge\(\)\.doubleValue\(\) : null,\s*entity\.getRatePerGram\(\)\.doubleValue\(\),\s*entity\.getStockQuantity\(\),\s*entity\.getHsnCode\(\),\s*/g, to: '' },
    { from: /Item\.getGrossWeight\(\)\.doubleValue\(\),\s*Item\.getNetWeight\(\) != null \? Item\.getNetWeight\(\)\.doubleValue\(\) : null,\s*Item\.getMakingCharge\(\) != null \? Item\.getMakingCharge\(\)\.doubleValue\(\) : null,\s*Item\.getRatePerGram\(\)\.doubleValue\(\),\s*Item\.getStockQuantity\(\),\s*Item\.getHsnCode\(\),\s*/g, to: '' }
]);

// 6. BillingService
const billingFile = 'backend/invoice-service/src/main/java/com/luxegem/invoice/service/BillingService.java';
modifyFile(billingFile, [
    { from: /item\.getGrossWeight\(\)\.doubleValue\(\),\s*item\.getNetWeight\(\) != null \? item\.getNetWeight\(\)\.doubleValue\(\) : null,\s*item\.getMakingCharge\(\) != null \? item\.getMakingCharge\(\)\.doubleValue\(\) : null,\s*item\.getRatePerGram\(\)\.doubleValue\(\),\s*item\.getStockQuantity\(\),\s*item\.getHsnCode\(\),\s*/g, to: '' }
]);
let bsContent = fs.readFileSync(billingFile, 'utf8');
bsContent = bsContent.replace(/InventoryEntity inventoryItem = inventoryRepository\.findByItemCode\(item\.itemCode\(\)\)[\s\S]*?inventoryRepository\.save\(inventoryItem\);\s*\}/, 'InventoryEntity inventoryItem = inventoryRepository.findByItemCode(item.itemCode()).orElse(null);\n            if (inventoryItem != null) {\n                detail.setInventory(inventoryItem);\n            }');
bsContent = bsContent.replace(/public List<InventoryItemResponse> getLowStockItems\(String shopId\) \{[\s\S]*?\}/, '');
fs.writeFileSync(billingFile, bsContent);

// 7. InventoryDataInitializer
const initFile = 'backend/invoice-service/src/main/java/com/luxegem/invoice/service/InventoryDataInitializer.java';
modifyFile(initFile, [
    { from: /,\s*new BigDecimal\(".*?"\),\s*new BigDecimal\(".*?"\),\s*new BigDecimal\(".*?"\),\s*new BigDecimal\(".*?"\),\s*\d+,\s*".*?"/g, to: '' },
    { from: /,\s*new BigDecimal\(".*?"\),\s*new BigDecimal\(".*?"\),\s*null,\s*new BigDecimal\(".*?"\),\s*\d+,\s*".*?"/g, to: '' }
]);

// 8. InventoryRepository
const repoFile = 'backend/invoice-service/src/main/java/com/luxegem/invoice/repository/InventoryRepository.java';
modifyFile(repoFile, [
    { from: /List<InventoryEntity> findByStockQuantityLessThanEqual\(Integer stockQuantity\);/g, to: '' }
]);

// 9. DashboardController
const dashCtrlFile = 'backend/dashboard-service/src/main/java/com/luxegem/dashboard/controller/DashboardController.java';
modifyFile(dashCtrlFile, [
    { from: /entity\.getGrossWeight\(\)\.doubleValue\(\),\s*entity\.getNetWeight\(\) != null \? entity\.getNetWeight\(\)\.doubleValue\(\) : null,\s*entity\.getMakingCharge\(\) != null \? entity\.getMakingCharge\(\)\.doubleValue\(\) : null,\s*entity\.getRatePerGram\(\)\.doubleValue\(\),\s*entity\.getStockQuantity\(\),\s*entity\.getHsnCode\(\),\s*/g, to: '' }
]);

// 10. DashboardAggregationService
const dashAggrFile = 'backend/dashboard-service/src/main/java/com/luxegem/dashboard/service/DashboardAggregationService.java';
modifyFile(dashAggrFile, [
    { from: /int lowStockCount = \(\(List<\?>\) inventoryResponse\.get\("lowStockItems"\)\)\.size\(\);\s*builder\.lowStockAlerts\(lowStockCount\);/, to: 'builder.lowStockAlerts(0);' }
]);
