import { deserializeWorkflow, deserializeSearchResult } from '../JSONParser';
import { Source, Workflow } from '../../types/workflow';
import { SearchResult, FunctionEntity } from '../../types/code_entities';
import { describe, it, expect } from 'vitest';

describe('JSONParser', () => {
  
  describe('deserializeWorkflow', () => {

    it('should deserialize valid Workflow JSON', () => {
      const jsonString = JSON.stringify({
        name: "Sample Workflow",
        steps: {
          "1": {
            id: "1",
            name: "Step One",
            prompt_template: {
              template: "Hello, {name}!",
              variables: [{
                name: "name",
                source: Source.DYNAMIC,
                allow_code_context_building: true,
                allow_llm_refinement: false
              }]
            }
          }
        }
      });

      const result: Workflow = deserializeWorkflow(jsonString);
      expect(result.name).toBe("Sample Workflow");
      expect(result.steps["1"].name).toBe("Step One");
      expect(result.steps["1"].prompt_template.template).toBe("Hello, {name}!");
      expect(result.steps["1"].prompt_template.variables[0].name).toBe("name");
    });

    it('should throw error for invalid JSON', () => {
      const invalidJsonString = "{name: 'Invalid'}";
      expect(() => deserializeWorkflow(invalidJsonString)).toThrow();
    });

    it('should throw error for JSON not matching Workflow type', () => {
      const wrongJsonString = JSON.stringify({
        title: "Wrong Workflow",
        items: []
      });
      expect(() => deserializeWorkflow(wrongJsonString)).toThrow();
    });


  });

  describe('deserializeSearchResult', () => {

    it('should deserialize valid SearchResult JSON', () => {
      const functionEntity: FunctionEntity = {
        docstring: "This is a function.",
        file_path: "/path/to/function",
        name: "sampleFunction",
        signature: "() => void",
        type: "function"
      };

      const jsonString = JSON.stringify({
        total: 1,
        entities: [{
          entity: functionEntity,
          score: 5
        }]
      });

      const result: SearchResult = deserializeSearchResult(jsonString);
      expect(result.total).toBe(1);
      expect((result.entities[0].entity as FunctionEntity).name).toBe("sampleFunction");
    });

    it('should throw error for invalid JSON', () => {
      const invalidJsonString = "{total: 10, items: []}";
      expect(() => deserializeSearchResult(invalidJsonString)).toThrow();
    });

    it('should throw error for JSON not matching SearchResult type', () => {
      const wrongJsonString = JSON.stringify({
        count: 1,
        results: []
      });
      expect(() => deserializeSearchResult(wrongJsonString)).toThrow();
    });

  });

});
