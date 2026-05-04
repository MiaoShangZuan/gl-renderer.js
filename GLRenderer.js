/**
 * WebGL 渲染器
 * 当前版本 0.2
 * 于2025年3月16日开始开发
 * @author MiaoShangZuan <3268208143@qq.com>
 */
class GLRenderer {
    constructor() {
        this.width = 300;
        this.height = 300;
        this.naturalWidth = 300;
        this.naturalHeight = 300;
        this.domElement = document.createElement('canvas');
        this.domElement.width = 300;
        this.domElement.height = 300;
        this.domElement.style.width = '300px';
        this.domElement.style.height = '300px';
        this.gl = this.domElement.getContext('webgl2');
        this.TEXTURE_UNIT_BUFFER = {};
        this.PROGRAMS = [];
    }
    setSize( width=300, height=300 ) {
        this.width = width;
        this.height = height;
        this.naturalWidth = width;
        this.naturalHeight = height;
        this.domElement.width = width;
        this.domElement.height = height;
        this.domElement.style.width = `${width}px`;
        this.domElement.style.height = `${height}px`;
        this.gl.viewport(0, 0, width, height);
    }
    setPixelRatio( dpr ) {
        const naturalWidth = this.width * dpr, naturalHeight = this.height * dpr;
        this.naturalWidth = naturalWidth;
        this.naturalHeight = naturalHeight;
        this.domElement.width = naturalWidth;
        this.domElement.height = naturalHeight;
        this.gl.viewport(0, 0, naturalWidth, naturalHeight);
    }
    createShader( type, source ) {
        const gl = this.gl, shader = gl.createShader(type);
        gl.shaderSource(shader, source); // 添加着色器源码
        gl.compileShader(shader); // 编译着色器
        return shader;
    }
    createProgram( vertexSource, fragmentSource ) {
        const gl = this.gl;

        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
        // 建立渲染程序
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        // 清理临时着色器
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }
    deleteBuffer( buffer ) {
        this.gl.deleteBuffer( buffer );
    }
    getTextureUnits() {
        return this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    }
    getPassCount() {
        return this.PROGRAMS.length;
    }
    inBlankTextureUnit( width, height, index=0, obj={} ) {
        const gl = this.gl, texture = gl.createTexture(),
        texture_filter_min = obj.filterMin || gl.NEAREST,
        texture_filter_mag = obj.filterMag || gl.NEAREST,
        texture_wrap_s = obj.wrapS || gl.CLAMP_TO_EDGE,
        texture_wrap_t = obj.wrapT || gl.CLAMP_TO_EDGE,
        texture_internalformat = obj.internalformat || gl.RGBA8,
        texture_format = obj.format || gl.RGBA,
        texture_type = obj.type || gl.UNSIGNED_BYTE;
        //console.log(texture_filter_min, obj);
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture_filter_min); // 平滑模式 gl.LINEAR
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture_filter_mag); // 平滑模式 gl.LINEAR
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texture_wrap_s);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texture_wrap_t);
        gl.texImage2D(gl.TEXTURE_2D, 0, texture_internalformat, width, height, 0, texture_format, texture_type, null);
        this.TEXTURE_UNIT_BUFFER[`unit_${index}`] = texture;
    }
    inTextureUnit( image, index=0, obj={} ) {
        const gl = this.gl, texture = gl.createTexture(),
        texture_filter_min = obj.filterMin || gl.NEAREST,
        texture_filter_mag = obj.filterMag || gl.NEAREST,
        texture_wrap_s = obj.wrapS || gl.CLAMP_TO_EDGE,
        texture_wrap_t = obj.wrapT || gl.CLAMP_TO_EDGE;
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture_filter_min); // 平滑模式 gl.LINEAR
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture_filter_mag); // 平滑模式 gl.LINEAR
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texture_wrap_s);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texture_wrap_t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        if(
            texture_filter_min === gl.LINEAR_MIPMAP_LINEAR ||
            texture_filter_min === gl.LINEAR_MIPMAP_NEAREST ||
            texture_filter_min === gl.NEAREST_MIPMAP_LINEAR ||
            texture_filter_min === gl.NEAREST_MIPMAP_NEAREST
        ) gl.generateMipmap(gl.TEXTURE_2D);
        texture.media = image;
        this.TEXTURE_UNIT_BUFFER[`unit_${index}`] = texture;
    }
    updateTextureUnit( index=0 ) {
        const gl = this.gl, texture = this.TEXTURE_UNIT_BUFFER[`unit_${index}`];
        if(texture) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.media);
        }
    }
    getTextureUnit( index=0 ) {
        return this.TEXTURE_UNIT_BUFFER[`unit_${index}`];
    }
    existsTextureUnit( index=0 ) {
        return !!this.TEXTURE_UNIT_BUFFER[`unit_${index}`];
    }
    deleteTextureUnit( index=0 ) {
        const texture = this.TEXTURE_UNIT_BUFFER[`unit_${index}`];
        if(texture) {
            this.gl.deleteTexture(texture);
            this.TEXTURE_UNIT_BUFFER[`unit_${index}`] = undefined;
        }
    }
    getUniformLocation( program, uniformName ) {
        return this.PROGRAMS[program.sequence].uniformLocation[uniformName];
    }
    addPass( obj ) {
        let program;
        if(obj.program) {
            program = obj.program;
            program.sequence = this.PROGRAMS.length;
        }
        else if(obj.vertexSource && obj.fragmentSource) {
            program = this.createProgram(obj.vertexSource, obj.fragmentSource);
            program.sequence = this.PROGRAMS.length;
        }
        const pass = {
            program,
            uniformLocation: {},
            drawFunc: obj.drawFunc,
            drawStartFunc: obj.drawStartFunc,
            drawEndFunc: obj.drawEndFunc
        };
        if(program && obj.uniformarr) {
            for(let uniformName of obj.uniformarr) {
                pass.uniformLocation[uniformName] = this.gl.getUniformLocation(program, uniformName);
            }
        }
        this.PROGRAMS.push(pass);
    }
    renderPicture() {
        for(let pass of this.PROGRAMS) pass.drawFunc(this.gl, pass.program, pass.drawStartFunc, pass.drawEndFunc);
    }
    outputAsync() {
        return new Promise(
            resolve => {
                const image = new Image();
                image.src = this.domElement.toDataURL('image/png');
                image.onload = ()=>{resolve(image)};
            }
        );
    }
}

export default GLRenderer;