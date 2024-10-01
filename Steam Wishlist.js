// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: gamepad;
const STEAM_STORE_URL = "https://store.steampowered.com"
const steamId = args.widgetParameter ?? "76561198091098592"
try {
  const wishListGames = await fetchWishListById(steamId) 
  const widget = await createWidget(wishListGames)
  renderWidget(widget)
} catch(error) {
  const widget = await createErrorWidget(error)
  renderWidget(widget)
}
  
async function createWidget(games) {
  const widget = new ListWidget()
  setBackground(widget, games[0])
  widget.addSpacer()
  await setTitleStack(widget)
  widget.addSpacer()
  await createGameGrid(widget, games, getMaxQuantityAllowed())
  widget.url = getUserWishListUrl()
  widget.addSpacer()
  return widget
}

async function createErrorWidget(error) {
  const widget = new ListWidget()
  setBackground(widget, {})
  widget.addSpacer()
  const contentStack = widget.addStack()
  contentStack.layoutHorizontally()
  contentStack.addSpacer()
//   const imageElement = contentStack.addImage(SFSymbol.named("wifi.exclamationmark").image)
//   imageElement.tintColor = Color.white()
//   imageElement.imageSize = new Size(27, 27)
//   contentStack.addSpacer()
//   const textElement = contentStack.addText("Cannot load games")
//   textElement.font = Font.systemFont(13)
//   textElement.textColor = Color.white()
//   contentStack.addSpacer()
//   widget.addSpacer(10)
  const errorDetailStack = widget.addStack()
  errorDetailStack.layoutHorizontally()
  errorDetailStack.addSpacer()
  const errorDetailElement = errorDetailStack.addText(error.toString().replace("Error: ", ""))
  errorDetailElement.font = Font.systemFont(12)
  errorDetailElement.textColor = Color.white()
  errorDetailStack.addSpacer()
  widget.addSpacer()
  return widget
}

async function fetchWishListById(steamId) {
  const url = `${STEAM_STORE_URL}/wishlist/profiles/${steamId}/wishlistdata`
  const request = new Request(url)
  const response = await request.loadJSON()
  return Object.keys(response)
    .map((steamIdMap) => response[steamIdMap])
    .filter((steamWishedGame) => steamWishedGame.subs && steamWishedGame.subs.length > 0)
    .sort((game1, game2) => game2.subs[0].discount_pct > game1.subs[0].discount_pct)
    .map((steamWishedGame) => {
      const idMatch = steamWishedGame.capsule.match('/apps/\\d+')
      if (idMatch && idMatch.length > 0) {
        return {
          ...steamWishedGame,
          name: replaceUnusedCharacters(steamWishedGame.name),
          id: Number(idMatch[0].replace('/apps/', '')),
        }
      }
      throw Error('Missing ID on steam wished game')
    })
}

function replaceUnusedCharacters(name) {
  return name
    .replace('™', '')
    .replace('®', '')
}

async function loadImageFromUrl(url) {
    let req = new Request(url)
    return req.loadImage()
}

async function setTitleStack(widget) {
  const titleStack = widget.addStack()
  titleStack.size = new Size(330, 15)
  const dateFormatter = new DateFormatter()
  dateFormatter.dateFormat = "HH:mm"
  const lastUpdate = titleStack.addText(`更新时间: ${dateFormatter.string(new Date())}`)
  lastUpdate.font = Font.mediumSystemFont(11)
  lastUpdate.textColor = Color.white()
  lastUpdate.textOpacity = 0.7
}

async function createGameGrid(widget, games, maxAmount) {
  let countAddedGames = 0
  let gameArray = []
  const gridStack = widget.addStack()
  gridStack.layoutVertically()
  const addGame = async (stack, game) => {
    if (countAddedGames >= maxAmount) {
      return
    }
    await addGameToStack(stack, game)
    countAddedGames++
  }
  
  if (maxAmount === 1) {
    gridStack.layoutHorizontally()
    gridStack.addSpacer(90)
    await addGame(gridStack, games[0])
    return
  }
  for (let count = 1; count <= games.length; count++) {
    const isCountEven = count % 2 === 0
    if (isCountEven) {
      const stack = gridStack.addStack()
      stack.addSpacer(10)
      await addGame(stack, games[count - 2])
      stack.addSpacer()
      await addGame(stack, games[count - 1])
      stack.addSpacer()
    } else if (count === games.length && !isCountEven) {
      const stack = gridStack.addStack()
      await addGame(stack, games[count - 1])
    }
  }
}

async function setBackground(widget, game) {
  const useGradientOnBackground = () => {
    const gradient = new LinearGradient()
    gradient.locations = [0, 1]
    gradient.colors = [
      new Color("171a21"),
      new Color("1b2838")
    ]
    widget.backgroundGradient = gradient
  }
  if (game.background) {
    try {
      widget.backgroundImage = await loadImageFromUrl(game.background)
    } catch (error) {
      log(error)
      useGradientOnBackground()
    }
  } else {
    useGradientOnBackground()
  }
}

async function addGameToStack(stack, game, allowVerticalPadding) {
  const bodyStack = stack.addStack()
  bodyStack.setPadding(5, 3, 5, 3)
  bodyStack.url = `https://store.steampowered.com/app/${game.id}`
  const folderElement = bodyStack.addImage(await loadImageFromUrl(game.capsule))
  folderElement.imageSize = new Size(80, 50)
  folderElement.cornerRadius = 10
  bodyStack.addSpacer(10)
  
  const pricingStack = bodyStack.addStack()
  pricingStack.layoutVertically()
  pricingStack.size = new Size(55, 45)
  
  const {discount_pct, discount_block} = game.subs?.[0] 
  const [, originalPrice, discountedPrice] = discount_block.toString()
      .match(new RegExp("\\w*[$฿₹¥₡£₩₪₺₱]?\\s?\\d+[,.]?[\\d-\\s]+[\\w₫ł₽₸€]+", 'mg'))
  const priceElement = pricingStack.addText(getFormattedPrice(discountedPrice ?? originalPrice))
  priceElement.minimumScaleFactor = 0.5
  priceElement.textColor = Color.white()
  priceElement.font = Font.semiboldSystemFont(12)
  pricingStack.addSpacer(5)
  
  if (discount_pct > 0) {
    const discountElement = pricingStack.addText(`-${discount_pct}%`)  
    discountElement.minimumScaleFactor = 0.5
    discountElement.textColor = Color.yellow()
    discountElement.font = Font.semiboldSystemFont(11)
  }
}

function renderWidget(widget) {
  if (config.runsInWidget) {
    Script.setWidget(widget)
  } else {
    widget.presentMedium()
  }

  Script.complete()
}

function getFormattedPrice(price) {
  return price.replace(new RegExp("-", "mg"), '0')
}

function getUserWishListUrl() {
  return `${STEAM_STORE_URL}/wishlist/profiles/${steamId}/`
}

function getMaxQuantityAllowed() {
  switch(config.widgetFamily) {
    case 'small':
      return 1
    case 'medium':
      return 4
    case 'large':
      return 10
    default:
      return 4
  }
}