// 合法的なデータ収集サービス
export interface DataCollectionConfig {
  interval: number; // 収集間隔（分）
  maxRetries: number;
  batchSize: number;
}

export class DataCollectionService {
  private config: DataCollectionConfig;
  private isRunning: boolean = false;

  constructor(config: DataCollectionConfig) {
    this.config = config;
  }

  // 定期的なデータ収集
  async startPeriodicCollection(asins: string[]): Promise<void> {
    if (this.isRunning) {
      console.log('Data collection is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting periodic data collection for ${asins.length} products`);

    while (this.isRunning) {
      try {
        await this.collectBatchData(asins);
        await this.sleep(this.config.interval * 60 * 1000);
      } catch (error) {
        console.error('Error in periodic collection:', error);
        await this.sleep(30000); // Wait 30 seconds before retry
      }
    }
  }

  // バッチでデータ収集
  private async collectBatchData(asins: string[]): Promise<void> {
    const batches = this.chunkArray(asins, this.config.batchSize);
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(asin => this.collectSingleProduct(asin))
      );
      
      // Rate limiting - wait between batches
      await this.sleep(5000);
    }
  }

  // 単一商品のデータ収集
  private async collectSingleProduct(asin: string): Promise<void> {
    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        const data = await this.fetchProductData(asin);
        await this.saveData(asin, data);
        console.log(`Successfully collected data for ${asin}`);
        return;
      } catch (error) {
        retries++;
        console.error(`Error collecting data for ${asin} (attempt ${retries}):`, error);
        
        if (retries < this.config.maxRetries) {
          await this.sleep(Math.pow(2, retries) * 1000); // Exponential backoff
        }
      }
    }
    
    console.error(`Failed to collect data for ${asin} after ${this.config.maxRetries} attempts`);
  }

  // Keepa APIを使用したデータ取得
  private async fetchProductData(asin: string): Promise<any> {
    const response = await fetch(`/keepa-api/product?key=${this.getApiKey()}&domain=5&asin=${asin}&stats=1&history=1`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  }

  // データの保存
  private async saveData(asin: string, data: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const record = {
      asin,
      timestamp,
      data: JSON.stringify(data),
      collected_at: Date.now()
    };

    // LocalStorageに保存（実際の実装ではデータベースを使用）
    const existingData = JSON.parse(localStorage.getItem('price_history') || '[]');
    existingData.push(record);
    
    // 古いデータを削除（30日以上前）
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filteredData = existingData.filter((record: any) => record.collected_at > thirtyDaysAgo);
    
    localStorage.setItem('price_history', JSON.stringify(filteredData));
  }

  // ユーティリティメソッド
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getApiKey(): string {
    const encryptedKey = localStorage.getItem('keepa_api_key');
    if (!encryptedKey) throw new Error('API key not found');
    return atob(encryptedKey);
  }

  // 収集停止
  stopCollection(): void {
    this.isRunning = false;
    console.log('Data collection stopped');
  }
}