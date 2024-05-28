// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import 'base64-sol/base64.sol';
import "./ITinyFrogRenderer.sol";
import "./TinyFrogData.sol";

contract TinyFrogRenderer is ITinyFrogRenderer, TinyFrogData {
  struct CharacterData {
    uint background;
    uint palette;

    uint base;
    uint warts;
    uint accesories;
    uint platform;
  }

  string[] public bgPaletteColors = [
    '0058F8', 
    'A4E4FC', 
    'D8B8F8', 
    'F8A4C0', 
    'FCE0A8', 
    'B8F8B8', 
    '00FCFC', 
    'D8D8D8', 
    'B8B8F8', 
    'BCBCBC',
    '4428BC',
    '940084',
    '503000',
    '004058',
    'A80020',
    'A80020'
  ];

  // body color 
  string[] public baseColorLight = [
     'B8F8B8',
     'D8B8F8',
     'A4E4FC',
     'B8B8F8',
     'F8B8F8',
     'F0D0B0',
     'FCE0A8',
     'F8D878',
     'D8F878',
     'B8F8D8'
  ];

  string[] public baseColorDark = [
    '008888',
    '00A800',
    '00B800',
    'AC7C00',
    'E45C10',
    'F83800',
    'E40058',
    'D800CC',
    '6844FC',
    '0078F8'
  ];

  function getSVG(uint256 seed, bool showBasedPlatform) external view override returns (string memory) {
    return _getSVG(seed, showBasedPlatform);
  }

  function _getSVG(uint256 seed, bool showBasedPlatform) internal view returns (string memory) {
    CharacterData memory data = _generateCharacterData(seed);

    string memory colorLight = baseColorLight[data.palette];
    string memory colorDark = baseColorDark[data.palette];

    string memory image = string(abi.encodePacked(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" width="512" height="512">'
      '<rect width="100%" height="100%" fill="#', bgPaletteColors[data.background], '"/>',

      _renderRectsBaseColorSwap(base[data.base], fullPalettes, colorLight, colorDark),
      _renderRectsBaseColorSwap(warts[data.warts], fullPalettes, colorLight, colorDark),
      _renderRects(accesories[data.accesories], fullPalettes),

      showBasedPlatform ? _renderRects(platform[data.platform], fullPalettes) : "",
      '</svg>'
    ));

    return image;
  }

  function getUnrevealedSVG(uint256 seed) external view override returns (string memory) {
    return _getUnrevealedSVG(seed);
  }

  function _getUnrevealedSVG(uint256 seed) internal view returns (string memory) {
    CharacterData memory data = _generateCharacterData(seed);

    string memory image = string(abi.encodePacked(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" width="512" height="512">'
      '<rect width="100%" height="100%" fill="#', bgPaletteColors[data.background], '"/>',
      _renderRects(misc[0], fullPalettes),
      '</svg>'
    ));

    return image;
  }

  function getDeadSVG(uint256 seed) external view override returns (string memory) {
    return _getDeadSVG(seed);
  }

  function _getDeadSVG(uint256) internal view returns (string memory) {
    //CharacterData memory data = _generateCharacterData(seed);

    string memory image = string(abi.encodePacked(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" width="512" height="512">'
      '<rect width="100%" height="100%" fill="#000000"/>',
      _renderRects(misc[1], fullPalettes),
      '</svg>'
    ));

    return image;
  }

  function getTraitsMetadata(uint256 seed, bool showBasedPlatform) external override view returns (string memory) {
    return _getTraitsMetadata(seed, showBasedPlatform);
  }

  function _getTraitsMetadata(uint256 seed, bool showBasedPlatform) internal view returns (string memory) {
    CharacterData memory data = _generateCharacterData(seed);

    // just for backgrounds
    string[17] memory lookup = [
      '0', '1', '2', '3', '4', '5', '6', '7',
      '8', '9', '10', '11', '12', '13', '14',
      '15', '16'
    ];

    string memory metadata = string(abi.encodePacked(
      '{"trait_type":"Background", "value":"', lookup[data.background+1], '"},',
      '{"trait_type":"Palette", "value":"', lookup[data.palette+1], '"},',
      '{"trait_type":"Body", "value":"', base_traits[data.base], '"},',
      '{"trait_type":"Warts", "value":"', warts_traits[data.warts], '"},',
      '{"trait_type":"Accessories", "value":"', accesories_traits[data.accesories], '"},'
      '{"trait_type":"Platform", "value":"', showBasedPlatform ? "None":platform_traits[data.platform], '"},'
      ));

    return metadata;
  }

  function _renderRects(bytes memory data, string[] memory palette) private pure returns (string memory) {
    string[33] memory lookup = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
      '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
      '30', '31', '32'
    ];

    string memory rects;
    uint256 drawIndex = 0;

    for (uint256 i = 0; i < data.length; i = i+2) {
      uint8 runLength = uint8(data[i]); // we assume runLength of any non-transparent segment cannot exceed image width (32px)
      uint8 colorIndex = uint8(data[i+1]);

      if (colorIndex != 0) { // transparent
        uint8 x = uint8(drawIndex % 32);
        uint8 y = uint8(drawIndex / 32);
        string memory color = palette[colorIndex];

        rects = string(abi.encodePacked(rects, '<rect width="', lookup[runLength], '" height="1" x="', lookup[x], '" y="', lookup[y], '" fill="#', color, '"/>'));
      }
      drawIndex += runLength;
    }

    return rects;
  }

  function _renderRectsBaseColorSwap(bytes memory data, string[] memory palette, string memory colorLight, string memory colorDark) private pure returns (string memory) {
    string[33] memory lookup = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
      '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
      '30', '31', '32'
    ];

    string memory rects;
    uint256 drawIndex = 0;

    for (uint256 i = 0; i < data.length; i = i+2) {
      uint8 runLength = uint8(data[i]); // we assume runLength of any non-transparent segment cannot exceed image width (32px)
      uint8 colorIndex = uint8(data[i+1]);
      uint8 x = uint8(drawIndex % 32);
      uint8 y = uint8(drawIndex / 32);

      if (colorIndex == 0) { // transparent
      }
      else if (colorIndex==3) { // LIGHT GRAY - replace color
        rects = string(abi.encodePacked(rects, '<rect width="', lookup[runLength], '" height="1" x="', lookup[x], '" y="', lookup[y], '" fill="#', colorLight, '"/>'));
      }
      else if (colorIndex==4) { // DARK GRAY - replace color
        rects = string(abi.encodePacked(rects, '<rect width="', lookup[runLength], '" height="1" x="', lookup[x], '" y="', lookup[y], '" fill="#', colorDark, '"/>'));
      }
      else { // any other color
        rects = string(abi.encodePacked(rects, '<rect width="', lookup[runLength], '" height="1" x="', lookup[x], '" y="', lookup[y], '" fill="#', palette[colorIndex], '"/>'));
      }
      drawIndex += runLength;
    }

    return rects;
  }

  function _generateCharacterData(uint256 seed) private view returns (CharacterData memory) {

    return CharacterData({
      background: seed % bgPaletteColors.length,
      palette: (seed/2) % baseColorLight.length,
      base: (seed/3) % base.length,
      warts: (seed/4) % warts.length,
      accesories: (seed/5) % accesories.length,
      platform: (seed/6) % platform.length
    });
  }
}