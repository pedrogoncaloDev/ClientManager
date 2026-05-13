# ClientManager

Aplicação fullstack construída em **Vue 3 (front-end)** e **Node.js + Express (back-end)** com banco de dados **MySQL**.  
Permite realizar operações de **CRUD de clientes** (criar, listar, editar e excluir) com validações, máscaras e integração com a API do **ViaCEP** para preenchimento automático de endereço.

---

## 🚀 Tecnologias

### Back-end
- Node.js
- Express
- MySQL2 (com Pool de conexões)
- Zod (validação de payloads)

### Front-end
- Vue 3 + Vite
- Vuetify 3 (UI)
- Pinia (store management)
- Axios (requisições HTTP)
- date-fns (formatação de datas)


## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js: v18.x ou superior
- npm: v9.x ou superior
- MySQL: v8.x
- Git: v2.x ou superior
- Vue.js: v3.x (via Vite)
- Vuetify: v3.x
- Express: v4.x
- Zod: v3.x

### 🔧 Instalação

1. **Clone o repositório**:
    ```bash
    git clone https://github.com/pedrogoncaloDev/ClientManager.git
    cd ClientManager

2. **Configurar o Banco de Dados MySQL**:
   1. *Crie o banco*
      ```bash
      CREATE DATABASE ClientManager;
  
      USE ClientManager;
      
      CREATE TABLE clientes (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        idUsuario INT NOT NULL,
        Codigo VARCHAR(15) NOT NULL,
        Nome VARCHAR(150) NOT NULL,
        CPF_CNPJ VARCHAR(20) NOT NULL,
        CEP VARCHAR(9),
        Logradouro VARCHAR(100),
        Endereco VARCHAR(120),
        Numero VARCHAR(20),
        Bairro VARCHAR(50),
        Cidade VARCHAR(60),
        UF CHAR(2),
        Complemento VARCHAR(150),
        Fone VARCHAR(20),
        LimiteCredito DECIMAL(10,2),
        Validade DATE,
        DataHoraCadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    2. *Ou restaure o backup do banco na pasta back_end/backup_databse*

4. **Instale as dependências do back-end:**
    ```bash
    cd back_end
    npm install

5. **Instale as dependências do front-end:**
    ```bash
    cd front_end
    npm install
    
6. **Configure os arquivos .env do front-end e back-end**
    1. *No frontend:*
        ```bash
        VITE_API_BASE_URL=http://localhost:3000
    
    2. *No backend*
        ```bash
        # MySQL
        DB_HOST=127.0.0.1
        DB_PORT=3306
        DB_USER=seu_usuario
        DB_PASS=seu_senha
        DB_NAME=ClientManager
        CORS_ORIGIN=http://localhost:5173
        
        # Servidor
        PORT=3000
        
7. **Execute npm run dev no front-end e back-end**
