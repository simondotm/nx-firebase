# Nx Setup Guide (Mac)

Clean installation steps for the whole setup of node/npm/nvm/nx, assuming mac with `zsh` shell.

Recommendations:

- Remove any pre-existing installations of node/npm/nvm/nx for a clean setup
- This guide recommends use of `nvm` to enable management of node versions which allows much easier switching between different node versions if you work across different projects with different dependencies

## 1. Install `antigen`

- Install [antigen](https://github.com/zsh-users/antigen) via [brew](https://formulae.brew.sh/formula/antigen) - `brew install antigen`
- Add `antigen` to your `~/.zshrc` file:

```
source $(brew --prefix)/share/antigen/antigen.zsh
```

- Restart your shell/terminal
- If you [get 'Antigen: Another process in running.' on shell startup](https://github.com/zsh-users/antigen/issues/543) just try closing & restarting your terminal/shell

## 2. Install `nvm` using the `zsh-nvm` plugin

- Use the excellent [zsh-nvm plugin](https://github.com/lukechilds/zsh-nvm) for nvm to make life easier (do not install `nvm` using brew)
- Add the following to your `~/.zshrc` file:

```
export NVM_DIR="$HOME/.nvm"
antigen bundle lukechilds/zsh-nvm
antigen apply
```

- Add any extra `zsh-nvm` options to your `~/.zshrc` file, such as:

```
export NVM_LAZY_LOAD=true
export NVM_AUTO_USE=true
```

- The finished `~/.zshrc` file looks something like this:

```
source $(brew --prefix)/share/antigen/antigen.zsh
export NVM_DIR="$HOME/.nvm"
export NVM_LAZY_LOAD=true
export NVM_AUTO_USE=true
antigen bundle lukechilds/zsh-nvm
antigen apply
```

- Restart your shell/terminal and verify installation using the `nvm --version`
- Upgrade `nvm` using `nvm upgrade`

## 3. Install `node`

- `nvm install <nodeversion>` eg. `nvm install 19.1.0`
- This will install node and a compatible version of `npm`/`npx` to `~/.nvm/versions/node/19.1.0/...`
- `echo $path` should now show `~/.nvm/versions/node/19.1.0/bin`
- `node`, `npm` and `npx` should now be accessible from the terminal/shell prompt

## 4. Installing multiple `node` versions (optional)

- Multiple node versions can be installed with `nvm install x.y.z`
- `nvm install node` will install the latest version
- Switch between node versions using `nvm use <version>`
- If your project requires a specific node version, add a `.nvmrc` file to the root of your project containing the text version required
- Remember that `npm` packages installed with `-g` are installed to the currently selected `node` version only, if you switch version, you may have to reinstall a global package for that version
- `nvm list` will show all installed versions
- `nvm current` will show the currently selected version
- `nvm default <version>` will select a version that you like to be the default when you run `nvm use default`

## 5. Install `nx`

- Select the node version you want to install `nx` to: `nvm use <version>`
- `npm i -g @nrwl/cli`
- `npm i -g nx`
- The previous command ensures that `nx` command line can be run without `npx`
- Not sure when this became a thing, nor sure if the nx cli is still required as a global install, but it works.
- `nx` should now be accessible from the terminal/shell prompt

## 6. Visual Studio Code

Recommended extensions for Nx development:

- [VS Code ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier Formatter for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Nx Console](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)
- [vscode-jest-runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)
