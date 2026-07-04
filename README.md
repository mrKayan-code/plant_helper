# Plant Helper

## Windows
```powershell
cd back
copy .env.example .env
npm install
```

PSH1:
```powershell
cd back
npm start
```

PSH2:
```powershell
cd front
npx serve -l 5500
```

## Linux
```fish
cd ~/Projects/plant_helper/back
cp .env.example .env
yarn install
```

Terminal1:
```fish
cd ~/Projects/plant_helper/back
yarn start
```

Terminal2:
```fish
cd ~/Projects/plant_helper/front
python3 -m http.server 5500
```