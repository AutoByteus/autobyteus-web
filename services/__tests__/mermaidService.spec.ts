import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mermaidService } from '../mermaidService';

// Partial mock of mermaid library
const renderMock = vi.fn();
const initializeMock = vi.fn();
const parseMock = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize: (...args: any[]) => initializeMock(...args),
    render: (...args: any[]) => renderMock(...args),
    parse: (...args: any[]) => parseMock(...args),
  },
}));

describe('mermaidService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize mermaid with default configuration', () => {
        mermaidService.initialize();
        expect(initializeMock).toHaveBeenCalledWith({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });
    });

    it('should initialize mermaid with dark theme if specified', () => {
        mermaidService.initialize(true);
        expect(initializeMock).toHaveBeenCalledWith({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
        });
    });

    it('should call render and return svg', async () => {
        renderMock.mockResolvedValue({ svg: '<svg>...</svg>' });
        const result = await mermaidService.render('graph TD; A-->B');
        
        expect(renderMock).toHaveBeenCalledWith(expect.stringMatching(/^mermaid-graph-\d+$/), 'graph TD; A-->B');
        expect(result).toBe('<svg>...</svg>');
    });

    it('should use provided ID for rendering', async () => {
        renderMock.mockResolvedValue({ svg: '<svg>...</svg>' });
        await mermaidService.render('graph TD; A-->B', 'my-id');
        
        expect(renderMock).toHaveBeenCalledWith('my-id', 'graph TD; A-->B');
    });

    it('should validate syntax using parse', async () => {
        parseMock.mockResolvedValue(true);
        const isValid = await mermaidService.validate('graph TD; A-->B');
        expect(parseMock).toHaveBeenCalledWith('graph TD; A-->B');
        expect(isValid).toBe(true);
    });

    it('should return false validation on error', async () => {
        parseMock.mockRejectedValue(new Error('Syntax error'));
        const isValid = await mermaidService.validate('invalid graph');
        expect(isValid).toBe(false);
    });
});
