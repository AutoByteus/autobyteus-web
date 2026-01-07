
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MonacoEditor from '../MonacoEditor.vue';
import loader from '@monaco-editor/loader';

// Mock Monaco Editor Loader
vi.mock('@monaco-editor/loader', () => ({
  default: {
    init: vi.fn(),
  },
}));

describe('MonacoEditor.vue', () => {
  let mockEditor: any;
  let mockMonaco: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Editor Instance
    mockEditor = {
      dispose: vi.fn(),
      getModel: vi.fn(() => ({
        dispose: vi.fn(),
        getFullModelRange: vi.fn(() => 'full-range'),
        getLineCount: vi.fn(() => 10),
        getLineMaxColumn: vi.fn(() => 5),
      })),
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      updateOptions: vi.fn(),
      getOption: vi.fn(),
      saveViewState: vi.fn(),
      restoreViewState: vi.fn(),
      pushUndoStop: vi.fn(),
      executeEdits: vi.fn(),
      addAction: vi.fn(),
      addCommand: vi.fn(),
      onDidChangeModelContent: vi.fn(),
    };

    // Mock Monaco Global
    mockMonaco = {
      editor: {
        create: vi.fn(() => mockEditor),
        EditorOption: {
          wordWrap: 'wordWrap',
        },
        setModelLanguage: vi.fn(),
        setTheme: vi.fn(),
      },
      KeyMod: {
        CtrlCmd: 2048,
      },
      KeyCode: {
        KEY_S: 49,
      },
      Range: vi.fn((startLine, startCol, endLine, endCol) => ({
        startLineNumber: startLine,
        startColumn: startCol,
        endLineNumber: endLine,
        endColumn: endCol,
      })),
    };

    (loader.init as any).mockResolvedValue(mockMonaco);
  });

  it('renders and initializes monaco editor', async () => {
    const wrapper = mount(MonacoEditor, {
      props: {
        modelValue: 'initial content',
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async init

    expect(loader.init).toHaveBeenCalled();
    expect(mockMonaco.editor.create).toHaveBeenCalled();
    expect(mockMonaco.editor.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ value: 'initial content' })
    );
  });

  it('uses full replace for non-append updates', async () => {
    const wrapper = mount(MonacoEditor, {
      props: {
        modelValue: 'initial',
      },
    });
    
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    // Simulate current state
    mockEditor.getValue.mockReturnValue('initial');

    // Update prop to something completely different
    await wrapper.setProps({ modelValue: 'completely different' });

    expect(mockEditor.executeEdits).toHaveBeenCalledWith(
        'external-update',
        expect.arrayContaining([
            expect.objectContaining({
                range: 'full-range', // Should use full range
                text: 'completely different'
            })
        ])
    );
  });

  it('uses optimization for append updates', async () => {
    const wrapper = mount(MonacoEditor, {
      props: {
        modelValue: 'initial',
      },
    });
    
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    // Simulate current state
    mockEditor.getValue.mockReturnValue('initial');

    // Update prop to append text
    await wrapper.setProps({ modelValue: 'initial appended' });

    // Should NOT use full range (which is mocked as 'full-range')
    // We expect it to calculate a new range based on the end of the file
    expect(mockEditor.executeEdits).toHaveBeenCalledWith(
        'external-update',
        expect.arrayContaining([
            expect.objectContaining({
                text: ' appended'
            })
        ])
    );

    // Verify it didn't use full range
    const calls = mockEditor.executeEdits.mock.calls;
    const lastCall = calls[calls.length - 1];
    const edits = lastCall[1];
    expect(edits[0].range).not.toBe('full-range');
  });
});
