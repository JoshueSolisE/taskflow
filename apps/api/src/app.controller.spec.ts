import { AppController } from './app.controller.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController();
  });

  describe('health', () => {
    it('should return the API health status', () => {
      const result = appController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('taskflow-api');
      expect(result.timestamp).toBeDefined();
      expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    });
  });
});
