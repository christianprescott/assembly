module.exports = {
  plugins: [
    "transform-class-properties",
    ["transform-define", { DEBUG: JSON.stringify(process.env.ASSEMBLY_DEBUG) }]
  ],
  presets: ["@babel/preset-env"]
}
