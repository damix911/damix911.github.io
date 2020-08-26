define(["require", "exports", "./webgl"], function (require, exports, webgl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AudubonVisuals = void 0;
    class AudubonVisuals {
        constructor(rctx) {
            if (!rctx) {
                rctx = new webgl_1.RenderingContextNode();
            }
            this._rctx = rctx;
            this._initialize();
        }
        createIndividualBird(x, y) {
            const setUniforms = new webgl_1.SetUniformsNode(this._globalNode);
            setUniforms.values["u_position"] = [x, y];
            setUniforms.values["u_phase"] = Math.random() * Math.PI * 2;
            setUniforms.values["u_color"] = [Math.random(), Math.random(), Math.random(), 1];
            new webgl_1.DrawNode(setUniforms);
        }
        render() {
            const globalNode = this._globalNode;
            if (!globalNode) {
                return;
            }
            globalNode.values["u_time"] = performance.now() / 1000.0;
            this._rctx.process();
        }
        _initialize() {
            const root = this._rctx;
            const solidProgram = new webgl_1.ProgramNode(root, `
      attribute vec2 a_position;

      uniform vec2 u_position;
      uniform float u_time;
      uniform float u_phase;
    
      void main(void) {
        vec2 d = 0.05 * vec2(cos(u_time + u_phase), sin(u_time + u_phase));
        gl_Position = vec4(a_position / 100.0 + u_position + d, 0.0, 1.0);
      }
    `, `
      precision mediump float;
    
      uniform vec4 u_color;
    
      void main(void) {
        gl_FragColor = u_color;
      }
    `, {
                a_position: 0
            }, [
                {
                    name: "u_color",
                    type: "vec4"
                },
                {
                    name: "u_position",
                    type: "vec2"
                },
                {
                    name: "u_time",
                    type: "float"
                },
                {
                    name: "u_phase",
                    type: "float"
                }
            ]);
            solidProgram.id = "solid";
            const quad = new webgl_1.InterleavedMeshNode(root, [{
                    size: 2,
                    type: 5126,
                    normalized: false
                }], 4, 6, 35044);
            new Float32Array(quad.vertexData).set([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]);
            quad.indexData.set([0, 1, 2, 1, 3, 2]);
            quad.upload();
            quad.id = "quad";
            const clearRed = new webgl_1.ClearNode(root, [1, 0, 0, 1], 1);
            const setMesh = new webgl_1.SetMeshNode(clearRed, "quad");
            const setProgram = new webgl_1.SetProgramNode(setMesh, "solid");
            this._globalNode = new webgl_1.SetUniformsNode(setProgram);
        }
    }
    exports.AudubonVisuals = AudubonVisuals;
});
// const root = new RenderingContextNode(undefined, { width: window.innerWidth, height: window.innerHeight });
