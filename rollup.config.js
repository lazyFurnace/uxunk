
export default {
    // 入口点
    input: './src/index.js',
    // 出口点
    output: {
        /**
         * 文件(file -o/--output.file)
         * String 要写入的文件。也可用于生成 sourcemaps，如果适用
         */
        file: 'uxunk.js',
        /**
         * 格式(format -f/--output.format)
         * String 变量名，代表你的 iife/umd 包，同一页上的其他脚本可以访问它。
         * amd – 异步模块定义，用于像RequireJS这样的模块加载器
         * cjs – CommonJS，适用于 Node 和 Browserify/Webpack
         * es – 将软件包保存为ES模块文件
         * iife – 一个自动执行的功能，适合作为<script>标签。（如果要为应用程序创建一个捆绑包，您可能想要使用它，因为它会使文件大小变小。）
         * umd – 通用模块定义，以amd，cjs 和 iife 为一体
         */
        format: 'es',
        /**
         * 生成包名称(name -n/--name)
         * String 变量名，代表你的 iife/umd 包，同一页上的其他脚本可以访问它。
         */
        name: 'uxunk',
        sourcemap: 'inline'
    }
};
