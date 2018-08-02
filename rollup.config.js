const ENV = process.env.NODE_ENV;
let rollupModule = {};
switch (ENV) {
    case 'library':
        rollupModule = {
            // 入口
            input: './src/index.js',
            // 出口
            output: {
                // 路径
                file: 'uxunk.js',
                // 生成包的格式
                format: 'umd',
                // 生成包名称(浏览器中导入 window 的名字)
                name: 'uxunk',
                sourcemap: 'inline'
            }
        }
        break;
    case 'example':
        rollupModule = {
            input: './example/index.jsx',
            output: {
                file: './component/index.js',
                format: 'umd',
                sourcemap: 'inline'
            }
        }
        break;
    default: 
        throw Error('未设置环境变量');
}
export default rollupModule;
