// 测试环境配置
require('@testing-library/jest-dom');

// 模拟全局对象
global.AMap = {
  Map: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    setZoom: jest.fn(),
    setCenter: jest.fn()
  })),
  Marker: jest.fn().mockImplementation(() => ({
    setMap: jest.fn()
  })),
  InfoWindow: jest.fn().mockImplementation(() => ({
    open: jest.fn()
  })),
  Pixel: jest.fn()
};

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// 模拟fetch
global.fetch = jest.fn();