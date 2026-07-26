export class MessageManager {
  private static instance: MessageManager;

  public static getInstance(): MessageManager {
    if (!MessageManager.instance) {
      MessageManager.instance = new MessageManager();
    }
    return MessageManager.instance;
  }

  // 各マネージャーからはこのメソッドを呼ぶ
  public notify(message: string): void {
    // Todo: UI実装前は開発用ログにとどめる
    console.log(`[Message]: ${message}`);
  }
}
