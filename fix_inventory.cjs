const fs = require('fs');

function fixContent(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/item\.type/g, 'item.metalType')
    .replace(/item\.sku/g, 'item.itemCode')
    .replace(/item\.quantity/g, 'item.stockQuantity')
    .replace(/item\.weightGrams/g, 'item.grossWeight')
    .replace(/item\.unitPrice/g, 'item.ratePerGram')
    .replace(/i\.sku/g, 'i.itemCode')
    .replace(/formatInvoiceType\(item\.metalType as InvoiceType\)/g, 'item.metalType + " " + item.purity')
    .replace(/formatInvoiceType\(item\.metalType\)/g, 'item.metalType + " " + item.purity')
    .replace(/formatInvoiceType\(type as InvoiceType\)/g, 'type')
    .replace(/formatInvoiceType\(type\)/g, 'type')
    .replace(/invoiceTypeOptions\.find/g, '// invoiceTypeOptions.find');
  fs.writeFileSync(filepath, content);
}

fixContent('src/components/InventoryEnhanced.tsx');
fixContent('src/components/InventorySection.tsx');
