import {useState, useEffect, useRef} from 'react';
import axios from 'axios'
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import {DataGrid} from '@mui/x-data-grid';
import {LocalizationProvider, DatePicker} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import TextField from '@mui/material/TextField';
import CountUp from 'react-countup';
import Button from '@mui/material/Button'
import SendIcon from '@mui/icons-material/Send'
import DeleteIcon from '@mui/icons-material/Delete'
import {format} from 'date-fns';
import {convertToLocalTime} from 'date-fns-timezone';
import {MapContainer, TileLayer, Polyline} from 'react-leaflet'
import CircularProgress from '@mui/material/CircularProgress';
import 'dayjs/locale/de';
import './App.css';
import 'leaflet/dist/leaflet.css';


export const App = () =>  {

  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')
  const [login, setLogin] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const [swims, setSwims] = useState([])
  const [swimmedLength, setSwimmedLength] = useState(0)
  const [toSwim, setToSwim] = useState([])
  const [swum, setSwum] = useState([])
  
  const [rowSelectionModel, setRowSelectionModel] = useState([])
  const toSwimRef = useRef([])
  
  const [data, setData] = useState({
    datum:'',
    strecke:'',
    dolphin:'',
    etappe:'',
    })


  // get initial data from netlify funcs
  // check if logged in
  useEffect(()=>{
    axios.get('/.netlify/functions/getSwims')
      .then(res => {
        setSwims(res.data)
        setLoading(false)
      })
      axios.get('/.netlify/functions/toSwim')
      .then(res => {
        setToSwim(res.data)
      })
    // set token  
    axios.get('/.netlify/functions/token')
      .then(res => {
        setToken(res.data)
        setIsLoggedIn( window.sessionStorage.getItem('token') === token ? true : false )
        
      })
  },[token])
 

  useEffect(()=>{
    if(toSwim.length > 0) {

      const strecke = swims.map(s=>s.strecke)
      const sum = strecke.reduce((a,b)=>a+b,0)
      setSwimmedLength(sum)
      
      let last =[]
      // initial swum value
      setSwum(toSwim)
      
      // get length of toSwim Polylines
      const latLngs = toSwimRef.current.getLatLngs()

      let distances = []    
      for(let i=0; i < latLngs.length-1; i++) {
        distances = [...distances, latLngs[i].distanceTo(latLngs[i+1])]
        
        // get max swum latlng
        if (distances.reduce((a,b)=>a+b,0) <= swimmedLength) {
          last = latLngs[i].lat
        }
      }

      // get index of last swum latlng 
      const indexOfLast = toSwim.map(s=>s[0]).indexOf(last)
      // set swum to last possible points
      setSwum(toSwim.slice(0,indexOfLast+1))
    }
    },[toSwim, swims, swimmedLength])
    

  const handleInputChange = (e) => {
    const updatedValue = {}
    updatedValue[e.target.name] = e.target.value;
    setData(d =>({...d, ...updatedValue}))
  }
  

  const handleDatePickerChange = (date) => {
    const updatedValue = {}
    updatedValue['datum'] = formatDate(date)
    setData(d =>({...d, ...updatedValue}))
  }

  const handleLoginInputChange = (e) => {
    setLogin(e.target.value)
  }

  const logout = () => {
    setIsLoggedIn(false)
    window.sessionStorage.removeItem('token');
  }


  /**
   * Format a date to a string
   *
   * @param date
   */
  const formatDate = (date) => {
    if (!date) return new Date().toLocaleString();

    // Get the timezone from browser using native methods
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dateTmp = Date.parse(date.toLocaleString());

    const localDate = convertToLocalTime(dateTmp, {
      timeZone: timezone,
    });

    return format(localDate, 'yyyy-MM-dd');
  };

  
  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('/.netlify/functions/addSwim', data)
      .then(res => setSwims(res.data))
  }
  
  const handleLoginSubmit = (e) => {
    e.preventDefault()
    axios.post('/.netlify/functions/login', login)
      .then(res => {
        if (res.data === 'OK') {
          setIsLoggedIn(true)
          window.sessionStorage.setItem('token', token);
        }
      })
  }

  const handleDelete = () => {
    if (window.confirm("Ganz sicher?")) {
      axios.post('.netlify/functions/deleteSwim', rowSelectionModel)
        .then(res => setSwims(res.data))
    } else {
      setRowSelectionModel([])
    }
  }
 
  const saveButtonDisabled = () => {
    if (!data.dolphin || !data.datum || !data.strecke ) 
      return true
    return false
  }

  const columns = [
    { 
      field: 'datum', 
      headerName: 'Datum', 
      width: 130,
    },
    { 
      field: 'strecke', 
      headerName: 'Strecke in m', 
      width: 130,
      type: 'number', 
      align: 'left',
      headerAlign: 'left',
    },
    { 
      field: 'name', 
      headerName: 'Dolphin', 
      width: 130 
    },
    {
      field: 'kommentar',
      headerName: 'Etappe',
      width: 700,
    },
  ];

  
  return (
    
    <div className="App">

      <Container maxWidth="lg">
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
          
          {loading &&
          
          <Box
          sx={{position: 'fixed', width:'100vw', height: '100%', overflow:'hidden',zIndex:9000, bottom:0, left:0, backgroundColor: 'rgba(255, 255, 255, 0.9)', backfaceVisibility: '30%'}}
          >
            <Box
              sx={{ position: 'absolute',left:'50%', top:'50%', transform: 'translate(-50%, -50%)', border: '1px solid white'}}
            >
              <CircularProgress />
            </Box>

          </Box>
          
          }
          
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt:15,
            }}
          >
            <Box sx ={{
              fontWeight: 'bold',
              fontSize: {xs:'4rem', md: '6rem', lg:'8rem'},
              width: {xs: '100%', md:'50%'},
              textAlign: 'center'
            }}
            >
              <CountUp 
                start={0} 
                end={swimmedLength/1000} 
                delay={0}
                separator=""
                decimal=','
                decimals={3}
              >
                {({ countUpRef }) => (
                  <span ref={countUpRef} />
                )}
              </CountUp>
            </Box>
            <Box sx={{fontSize:'.9rem', ml:2, display:{ xs: 'none', lg: 'block' }}}>
              km geschwommen
            </Box>
          </Box>
          
          { isLoggedIn

          ?
          
          <>
          
          <form onSubmit={handleSubmit} >
            <Box
              sx={{
                display:{xs: 'block', md:'flex'} ,
                justifyContent: 'space-evenly',
                mt:5,
              }}
            >
              <DatePicker 
                sx={{width: {xs:'100%', md:'auto'}, mb: {xs:3, md:0}}}
                label="Datum"
                onChange={handleDatePickerChange}
                required
                />
              <TextField
                sx={{width: {xs:'100%', md:'auto'}, mb: {xs:3, md:0}}}
                type="number"
                label="Strecke in m"
                name="strecke"
                required
                InputProps={{
                  inputProps: { 
                    min: 0 
                  }
                }}
                onChange={(e) => handleInputChange(e)}
                />
              <TextField
                sx={{width: {xs:'100%', md:'auto'}, mb: {xs:3, md:0}}}
                label="Dolphin"
                name="dolphin"
                onChange={(e) => handleInputChange(e)}
                required
              />
              <TextField
                sx={{width: {xs:'100%', md:'auto'}, mb: {xs:3, md:0}}}
                label="Etappe"
                name="etappe"
                onChange={(e) => handleInputChange(e)}
              />
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
            <Box sx={{my:10, justifyContent:'center'}} >
              <Button 
                type="submit" 
                variant="contained" 
                size="large" 
                endIcon={<SendIcon />} 
                color="warning"
                disabled={saveButtonDisabled()}
              >
                Speichern
              </Button>
              <Box 
                onClick={()=>logout()}
                sx={{
                  cursor:'pointer', 
                  mt:2, opacity: '.4', 
                  textAlign: 'center', 
                  '&:hover': {
                    opacity: '1'
                  }
                }}
              >
                Logout
              </Box>
          </Box>
            </Box>
          </form>
          
          
          <Box sx={{ mb:20, width: '100%' }}>
            <DataGrid
              autoHeight
              rows={swims}
              columns={columns}
              checkboxSelection
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              onRowSelectionModelChange={(newRowSelectionModel) => {
                setRowSelectionModel(newRowSelectionModel);
              }}
              rowSelectionModel={rowSelectionModel}
            />
          <>
          { rowSelectionModel.length > 0 &&
            <Button 
              sx={{mt:2, display:'flex'}} 
              variant="outlined" 
              size="small" 
              endIcon={<DeleteIcon />} 
              color="error"
              onClick={handleDelete}
              >
                {rowSelectionModel.length} Ausgewählte Löschen
              </Button>
            }
            </>
          </Box>

          </>
          
          :

          <>

          <form onSubmit={handleLoginSubmit} >
            <Box
              sx={{
                display:{xs: 'block', md:'flex'} ,
                justifyContent: 'center',
                my:5,
              }}
            >
              <TextField
                sx={{
                  width: {xs:'100%', md:'auto'}, 
                  mb: {xs:3, md:0}, 
                  mr: 2
                }}
                label="Passwort"
                name="login"
                type="password"
                autoComplete="login"
                onChange={(e) => handleLoginInputChange(e)}
              />
              <Button 
                type="submit" 
                variant="contained" 
                size="large" 
                endIcon={<SendIcon />} 
                color="warning"
              >
                Login
              </Button>
            </Box>
          </form>
          </>
          
          }


          <MapContainer 
            center={[51.505, -0.09]} 
            zoom={4} 
            scrollWheelZoom={false} 
            style={{ height: '700px', marginBottom:'10rem' }}
          >
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            />
            <Polyline ref={toSwimRef} pathOptions={{color: 'black', weight:3}} positions={toSwim} />
            <Polyline pathOptions={{color: 'red', weight:3}} positions={swum} />
          </MapContainer>
        
        </LocalizationProvider>
      
      </Container>

    </div>
  );
}

export default App;
